import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import {
  LedgerEntryType,
  NotificationColor,
  OrderStatus,
  Prisma,
  TradeSide,
  TradeStatus,
} from "@prisma/client";
import { normalizeDigits } from "../auth/auth.service";
import type { SessionUser } from "../auth/auth.types";
import { PriceSourceService } from "../prices/price-source.service";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

export interface CreateOrderInput {
  productId?: string;
  side?: string;
  quantity?: string | number;
  clientRequestId?: string;
}

interface LockedOrderRow {
  id: string;
  quoteCode: string;
  userId: string;
  productId: string;
  side: TradeSide;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  status: OrderStatus;
  expiresAt: Date | null;
  createdAt: Date;
}

function getTehranMinutesNow(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function isWithinWorkingHours(rawHours: string): boolean {
  const ascii = normalizeDigits(rawHours);
  const matches = ascii.match(/(\d{1,2}):(\d{2})/g);
  if (!matches || matches.length < 2) {
    return true;
  }
  const [h1, m1] = matches[0].split(":").map(Number);
  const [h2, m2] = matches[1].split(":").map(Number);
  const start = h1 * 60 + m1;
  const end = h2 * 60 + m2;
  const now = getTehranMinutesNow();
  if (start <= end) {
    return now >= start && now <= end;
  }
  return now >= start || now <= end;
}

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);
  private expiryTimer: NodeJS.Timeout | null = null;
  private isExpiring = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly priceSourceService: PriceSourceService,
    private readonly realtime: RealtimeGateway
  ) {}

  onModuleInit() {
    this.expiryTimer = setInterval(() => {
      void this.expireOverdueOrders();
    }, 1000);
    this.expiryTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  async createOrder(user: SessionUser, input: CreateOrderInput) {
    const clientRequestId = input.clientRequestId?.trim() || null;

    if (clientRequestId) {
      const existing = await this.prisma.order.findUnique({
        where: {
          userId_clientRequestId: {
            userId: user.id,
            clientRequestId,
          },
        },
        include: {
          product: { select: { id: true, name: true, unit: true, badge: true } },
          user: { select: { id: true, fullName: true, username: true } },
        },
      });
      if (existing) {
        return { order: existing, idempotent: true };
      }
    }

    const settingRows = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            "trading_stopped",
            "enforce_working_hours",
            "working_hours",
            "response_timeout_seconds",
            "shadow_mode",
          ],
        },
      },
    });
    const settingsMap = new Map(settingRows.map((s) => [s.key, s.value]));

    if (settingsMap.get("trading_stopped") === "true") {
      throw new BadRequestException("معاملات توسط مدیر متوقف شده است");
    }

    if (settingsMap.get("enforce_working_hours") === "true") {
      const hoursStr = settingsMap.get("working_hours") ?? "۱۰:۳۰ تا ۲۱:۰۰";
      if (!isWithinWorkingHours(hoursStr)) {
        throw new BadRequestException(
          `ثبت سفارش خارج از ساعت کاری (${hoursStr}) مجاز نیست`
        );
      }
    }

    const sideRaw = (input.side ?? "").trim().toUpperCase();
    if (sideRaw !== "BUY" && sideRaw !== "SELL") {
      throw new BadRequestException("نوع سفارش (خرید یا فروش) معتبر نیست");
    }
    const side = sideRaw as TradeSide;

    const productId = input.productId?.trim() ?? "";
    if (!productId) {
      throw new BadRequestException("انتخاب نماد الزامی است");
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException("کالای مورد نظر یافت نشد");
    }
    if (!product.isActive) {
      throw new BadRequestException("این نماد در حال حاضر غیرفعال است");
    }

    const isAdmin =
      user.role.code === "ADMIN" || user.role.code === "SYSTEM_MANAGER";
    if (!isAdmin) {
      const accessCount = await this.prisma.userGroupMember.count({
        where: {
          userId: user.id,
          group: {
            products: {
              some: { productId: product.id },
            },
          },
        },
      });
      if (accessCount === 0) {
        throw new ForbiddenException("شما به این نماد دسترسی ندارید");
      }
    }

    const freshness = await this.priceSourceService.getBoardFreshness();
    if (freshness.isStale) {
      throw new BadRequestException(
        "قیمت نماد منقضی شده است؛ امکان ثبت سفارش با قیمت قدیمی وجود ندارد"
      );
    }

    let quantity: Prisma.Decimal;
    try {
      const rawQty = normalizeDigits(String(input.quantity ?? "")).trim();
      if (!rawQty) {
        throw new BadRequestException("مقدار سفارش الزامی است");
      }
      quantity = new Prisma.Decimal(rawQty);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException("مقدار سفارش معتبر نیست");
    }

    if (
      !quantity.isFinite() ||
      quantity.lte(0) ||
      quantity.lt(product.minOrder) ||
      quantity.gt(product.maxOrder)
    ) {
      throw new BadRequestException(
        `مقدار سفارش باید بین ${product.minOrder.toString()} و ${product.maxOrder.toString()} ${product.unit} باشد`
      );
    }

    const unitPrice =
      side === TradeSide.BUY ? product.buyPrice : product.sellPrice;
    const totalAmount = quantity
      .mul(unitPrice)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

    const timeoutSec = Number(
      settingsMap.get("response_timeout_seconds") ?? "60"
    );
    const effectiveTimeout =
      Number.isFinite(timeoutSec) && timeoutSec > 0 ? timeoutSec : 60;
    const expiresAt = new Date(Date.now() + effectiveTimeout * 1000);
    const quoteCode = `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(
      3
    )
      .toString("hex")
      .toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        quoteCode,
        userId: user.id,
        productId: product.id,
        side,
        quantity,
        unitPrice,
        totalAmount,
        status: OrderStatus.PENDING_APPROVAL,
        clientRequestId,
        expiresAt,
      },
      include: {
        product: { select: { id: true, name: true, unit: true, badge: true } },
        user: { select: { id: true, fullName: true, username: true } },
      },
    });

    const shadowMode = settingsMap.has("shadow_mode")
      ? settingsMap.get("shadow_mode") === "true"
      : process.env.SHADOW_MODE === "true";

    if (shadowMode) {
      await this.prisma.shadowLog.create({
        data: {
          action: "ORDER_SUBMIT",
          orderId: order.id,
          userId: order.userId,
          productId: order.productId,
          side: order.side,
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount,
          status: "SHADOW_PENDING",
          details: `ثبت سفارش در حالت سایه (${order.quoteCode})`,
        },
      });
    }

    this.realtime.broadcastNewOrder({
      id: order.id,
      quoteCode: order.quoteCode,
      userId: order.userId,
      userName: order.user.fullName,
      productId: order.productId,
      productName: order.product.name,
      unit: order.product.unit,
      side: order.side,
      quantity: order.quantity.toString(),
      unitPrice: order.unitPrice.toFixed(0),
      totalAmount: order.totalAmount.toFixed(0),
      status: order.status,
      expiresAt: order.expiresAt!.toISOString(),
      createdAt: order.createdAt.toISOString(),
    });

    return { order, idempotent: false };
  }

  async approveOrder(orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LockedOrderRow[]>`
        SELECT id, "quoteCode", "userId", "productId", side, quantity, "unitPrice", "totalAmount", status, "expiresAt", "createdAt"
        FROM "orders"
        WHERE id = ${orderId}
        FOR UPDATE
      `;
      const locked = rows[0];
      if (!locked) {
        throw new NotFoundException("سفارش یافت نشد");
      }
      if (locked.status !== OrderStatus.PENDING_APPROVAL) {
        throw new ConflictException("این سفارش قبلاً تعیین تکلیف یا لغو شده است");
      }
      if (locked.expiresAt && new Date(locked.expiresAt).getTime() <= Date.now()) {
        throw new ConflictException("مهلت تایید این سفارش منقضی شده است");
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.APPROVED },
        include: {
          product: { select: { id: true, name: true, unit: true, badge: true } },
          user: { select: { id: true, fullName: true, mobile: true } },
        },
      });

      const shadowSetting = await tx.setting.findUnique({
        where: { key: "shadow_mode" },
      });
      const shadowMode = shadowSetting
        ? shadowSetting.value === "true"
        : process.env.SHADOW_MODE === "true";

      if (shadowMode) {
        await tx.shadowLog.create({
          data: {
            action: "ORDER_APPROVE",
            orderId: updatedOrder.id,
            userId: updatedOrder.userId,
            productId: updatedOrder.productId,
            side: updatedOrder.side,
            quantity: updatedOrder.quantity,
            unitPrice: updatedOrder.unitPrice,
            totalAmount: updatedOrder.totalAmount,
            status: "SHADOW_APPROVED",
            details: `تایید سفارش در حالت سایه بدون ثبت معامله و سند (${updatedOrder.quoteCode})`,
          },
        });
        return { order: updatedOrder, trade: null, shadowMode: true };
      }

      const tradeCode = `TRD-${Date.now().toString(36).toUpperCase()}-${randomBytes(
        3
      )
        .toString("hex")
        .toUpperCase()}`;
      const trade = await tx.trade.create({
        data: {
          tradeCode,
          orderId: updatedOrder.id,
          userId: updatedOrder.userId,
          productId: updatedOrder.productId,
          side: updatedOrder.side,
          quantity: updatedOrder.quantity,
          unitPrice: updatedOrder.unitPrice,
          totalAmount: updatedOrder.totalAmount,
          settlementTerm: "نقد فردا",
          status: TradeStatus.APPROVED,
        },
      });

      // Ensure system_treasury counterparty user exists for balanced double-entry
      let treasury = await tx.user.findUnique({
        where: { username: "system_treasury" },
      });
      if (!treasury) {
        const adminRole = await tx.role.findFirst({ orderBy: { level: "asc" } });
        treasury = await tx.user.create({
          data: {
            code: 0,
            username: "system_treasury",
            fullName: "خزانه مرکزی رویال شمش",
            mobile: "09000000000",
            roleId: adminRole!.id,
            isActive: false,
          },
        });
      }

      const isBuy = updatedOrder.side === TradeSide.BUY;
      const docPrefix = `DOC-${trade.tradeCode}`;
      await tx.ledgerEntry.createMany({
        data: [
          {
            documentNumber: `${docPrefix}-UC`,
            userId: updatedOrder.userId,
            tradeId: trade.id,
            entryType: isBuy ? LedgerEntryType.DEBIT : LedgerEntryType.CREDIT,
            rialAmount: updatedOrder.totalAmount,
            goldGrams: new Prisma.Decimal(0),
            description: `${isBuy ? "بدهکار خرید" : "بستانکار فروش"} ${updatedOrder.product.name} (${trade.tradeCode})`,
            isFinalized: true,
          },
          {
            documentNumber: `${docPrefix}-TC`,
            userId: treasury.id,
            tradeId: trade.id,
            entryType: isBuy ? LedgerEntryType.CREDIT : LedgerEntryType.DEBIT,
            rialAmount: updatedOrder.totalAmount,
            goldGrams: new Prisma.Decimal(0),
            description: `طرف خزانه وجه ${updatedOrder.product.name} (${trade.tradeCode})`,
            isFinalized: true,
          },
          {
            documentNumber: `${docPrefix}-UG`,
            userId: updatedOrder.userId,
            tradeId: trade.id,
            productId: updatedOrder.productId,
            entryType: isBuy ? LedgerEntryType.GOLD_IN : LedgerEntryType.GOLD_OUT,
            rialAmount: new Prisma.Decimal(0),
            goldGrams: updatedOrder.quantity,
            description: `${isBuy ? "ورود کالای" : "خروج کالای"} ${updatedOrder.product.name} (${trade.tradeCode})`,
            isFinalized: true,
          },
          {
            documentNumber: `${docPrefix}-TG`,
            userId: treasury.id,
            tradeId: trade.id,
            productId: updatedOrder.productId,
            entryType: isBuy ? LedgerEntryType.GOLD_OUT : LedgerEntryType.GOLD_IN,
            rialAmount: new Prisma.Decimal(0),
            goldGrams: updatedOrder.quantity,
            description: `طرف خزانه کالای ${updatedOrder.product.name} (${trade.tradeCode})`,
            isFinalized: true,
          },
        ],
      });

      await tx.notification.create({
        data: {
          userId: updatedOrder.userId,
          title: "تایید سفارش معامله",
          body: `سفارش ${updatedOrder.quoteCode} (${updatedOrder.product.name}) تایید و معامله ${trade.tradeCode} ثبت شد.`,
          priorityColor: NotificationColor.GREEN,
        },
      });

      const approveRule = await tx.smsRule.findFirst({
        where: {
          isActive: true,
          title: { contains: "پس از تایید معامله" },
        },
      });
      if (approveRule) {
        await tx.smsLog.create({
          data: {
            userId: updatedOrder.userId,
            orderId: updatedOrder.id,
            ruleCode: approveRule.code,
            ruleTitle: approveRule.title,
            mobile: updatedOrder.user.mobile,
            body: approveRule.templateText,
            status: "STUB",
          },
        });
      }

      return { order: updatedOrder, trade };
    });

    this.realtime.broadcastOrderUpdated({
      id: result.order.id,
      quoteCode: result.order.quoteCode,
      userId: result.order.userId,
      userName: result.order.user.fullName,
      productId: result.order.productId,
      productName: result.order.product.name,
      unit: result.order.product.unit,
      side: result.order.side,
      quantity: result.order.quantity.toString(),
      unitPrice: result.order.unitPrice.toFixed(0),
      totalAmount: result.order.totalAmount.toFixed(0),
      status: result.order.status,
      rejectionReason: null,
      expiresAt: result.order.expiresAt?.toISOString() ?? new Date().toISOString(),
      createdAt: result.order.createdAt.toISOString(),
      decidedAt: new Date().toISOString(),
    });

    return result;
  }

  async rejectOrder(orderId: string, reason?: string) {
    const rejectionReason = reason?.trim() || "رد شده توسط مدیر";

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<LockedOrderRow[]>`
        SELECT id, "quoteCode", "userId", "productId", side, quantity, "unitPrice", "totalAmount", status, "expiresAt", "createdAt"
        FROM "orders"
        WHERE id = ${orderId}
        FOR UPDATE
      `;
      const locked = rows[0];
      if (!locked) {
        throw new NotFoundException("سفارش یافت نشد");
      }
      if (locked.status !== OrderStatus.PENDING_APPROVAL) {
        throw new ConflictException("این سفارش قبلاً تعیین تکلیف یا لغو شده است");
      }
      if (locked.expiresAt && new Date(locked.expiresAt).getTime() <= Date.now()) {
        throw new ConflictException("مهلت تایید این سفارش منقضی شده است");
      }

      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REJECTED, rejectionReason },
        include: {
          product: { select: { id: true, name: true, unit: true, badge: true } },
          user: { select: { id: true, fullName: true, mobile: true } },
        },
      });

      const shadowSetting = await tx.setting.findUnique({
        where: { key: "shadow_mode" },
      });
      const shadowMode = shadowSetting
        ? shadowSetting.value === "true"
        : process.env.SHADOW_MODE === "true";

      if (shadowMode) {
        await tx.shadowLog.create({
          data: {
            action: "ORDER_REJECT",
            orderId: order.id,
            userId: order.userId,
            productId: order.productId,
            side: order.side,
            quantity: order.quantity,
            unitPrice: order.unitPrice,
            totalAmount: order.totalAmount,
            status: "SHADOW_REJECTED",
            details: `رد سفارش در حالت سایه (${rejectionReason})`,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: "رد سفارش معامله",
          body: `سفارش ${order.quoteCode} (${order.product.name}) رد شد: ${rejectionReason}`,
          priorityColor: NotificationColor.RED,
        },
      });

      const rejectRule = await tx.smsRule.findFirst({
        where: {
          isActive: true,
          title: { contains: "پس از رد معامله" },
        },
      });
      if (rejectRule) {
        await tx.smsLog.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            ruleCode: rejectRule.code,
            ruleTitle: rejectRule.title,
            mobile: order.user.mobile,
            body: rejectRule.templateText,
            status: "STUB",
          },
        });
      }

      return order;
    });

    this.realtime.broadcastOrderUpdated({
      id: updatedOrder.id,
      quoteCode: updatedOrder.quoteCode,
      userId: updatedOrder.userId,
      userName: updatedOrder.user.fullName,
      productId: updatedOrder.productId,
      productName: updatedOrder.product.name,
      unit: updatedOrder.product.unit,
      side: updatedOrder.side,
      quantity: updatedOrder.quantity.toString(),
      unitPrice: updatedOrder.unitPrice.toFixed(0),
      totalAmount: updatedOrder.totalAmount.toFixed(0),
      status: updatedOrder.status,
      rejectionReason: updatedOrder.rejectionReason,
      expiresAt: updatedOrder.expiresAt?.toISOString() ?? new Date().toISOString(),
      createdAt: updatedOrder.createdAt.toISOString(),
      decidedAt: new Date().toISOString(),
    });

    return { order: updatedOrder };
  }

  async expireOverdueOrders() {
    if (this.isExpiring) return;
    this.isExpiring = true;
    try {
      const candidates = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING_APPROVAL,
          expiresAt: { lte: new Date() },
        },
        select: { id: true },
        take: 25,
      });

      for (const c of candidates) {
        try {
          const expiredOrder = await this.prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<LockedOrderRow[]>`
              SELECT id, "quoteCode", "userId", "productId", side, quantity, "unitPrice", "totalAmount", status, "expiresAt", "createdAt"
              FROM "orders"
              WHERE id = ${c.id}
              FOR UPDATE
            `;
            const locked = rows[0];
            if (
              !locked ||
              locked.status !== OrderStatus.PENDING_APPROVAL ||
              !locked.expiresAt ||
              new Date(locked.expiresAt).getTime() > Date.now()
            ) {
              return null;
            }

            const order = await tx.order.update({
              where: { id: c.id },
              data: { status: OrderStatus.EXPIRED },
              include: {
                product: { select: { id: true, name: true, unit: true, badge: true } },
                user: { select: { id: true, fullName: true } },
              },
            });

            await tx.notification.create({
              data: {
                userId: order.userId,
                title: "انقضای مهلت سفارش",
                body: `مهلت پاسخگویی سفارش ${order.quoteCode} (${order.product.name}) به پایان رسید.`,
                priorityColor: NotificationColor.RED,
              },
            });

            return order;
          });

          if (expiredOrder) {
            this.realtime.broadcastOrderUpdated({
              id: expiredOrder.id,
              quoteCode: expiredOrder.quoteCode,
              userId: expiredOrder.userId,
              userName: expiredOrder.user.fullName,
              productId: expiredOrder.productId,
              productName: expiredOrder.product.name,
              unit: expiredOrder.product.unit,
              side: expiredOrder.side,
              quantity: expiredOrder.quantity.toString(),
              unitPrice: expiredOrder.unitPrice.toFixed(0),
              totalAmount: expiredOrder.totalAmount.toFixed(0),
              status: expiredOrder.status,
              rejectionReason: null,
              expiresAt:
                expiredOrder.expiresAt?.toISOString() ??
                new Date().toISOString(),
              createdAt: expiredOrder.createdAt.toISOString(),
              decidedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          this.logger.warn(`Failed to expire order ${c.id}: ${String(err)}`);
        }
      }
    } finally {
      this.isExpiring = false;
    }
  }

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, unit: true, badge: true } },
      },
    });
  }

  async listMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  async listPendingOrdersAdmin() {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_APPROVAL,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, unit: true, badge: true } },
        user: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  async listSmsStubs(orderId?: string) {
    return this.prisma.smsLog.findMany({
      where: orderId ? { orderId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException("سفارش یافت نشد");
    }
    if (order.userId !== userId) {
      throw new ForbiddenException("شما مجاز به لغو این سفارش نیستید");
    }
    if (order.status !== OrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException("فقط سفارش‌های در انتظار تایید قابل لغو هستند");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: {
        product: { select: { id: true, name: true, unit: true, badge: true } },
      },
    });
  }
}
