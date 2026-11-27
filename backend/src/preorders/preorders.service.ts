import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import {
  NotificationColor,
  OrderStatus,
  PreOrderStatus,
  Prisma,
  TradeSide,
} from "@prisma/client";
import { normalizeDigits } from "../auth/auth.service";
import type { SessionUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

export interface CreatePreOrderInput {
  productId?: string;
  side?: string;
  targetPrice?: string | number;
  weightGrams?: string | number;
}

export interface CreateManualPreOrderInput extends CreatePreOrderInput {
  userId?: string;
}

interface LockedPreOrderRow {
  id: string;
  userId: string;
  productId: string;
  side: TradeSide;
  targetPrice: Prisma.Decimal;
  weightGrams: Prisma.Decimal;
  status: PreOrderStatus;
  expiresAt: Date | null;
}

export function getEndOfTehranDay(now = new Date()): Date {
  const tehranDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${tehranDate}T23:59:59.999+03:30`);
}

@Injectable()
export class PreOrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PreOrdersService.name);
  private expiryTimer: NodeJS.Timeout | null = null;
  private isExpiring = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway
  ) {}

  onModuleInit() {
    this.expiryTimer = setInterval(() => {
      void this.expireOverduePreOrders();
    }, 2000);
    this.expiryTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private parsePositiveDecimal(
    raw: string | number | undefined,
    label: string
  ): Prisma.Decimal {
    const clean = normalizeDigits(String(raw ?? "")).trim();
    if (!clean) {
      throw new BadRequestException(`${label} الزامی است`);
    }
    try {
      const dec = new Prisma.Decimal(clean);
      if (!dec.isFinite() || dec.lte(0)) {
        throw new BadRequestException(`${label} باید بزرگ‌تر از صفر باشد`);
      }
      return dec;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`${label} معتبر نیست`);
    }
  }

  private async createValidatedPreOrder(params: {
    ownerUserId: string;
    enforceGroupAccess: boolean;
    createdByAdminId: string | null;
    isManual: boolean;
    input: CreatePreOrderInput;
  }) {
    const sideRaw = (params.input.side ?? "").trim().toUpperCase();
    if (sideRaw !== "BUY" && sideRaw !== "SELL") {
      throw new BadRequestException("نوع پیش‌سفارش (خرید یا فروش) معتبر نیست");
    }
    const side = sideRaw as TradeSide;

    const productId = params.input.productId?.trim() ?? "";
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

    if (params.enforceGroupAccess) {
      const accessCount = await this.prisma.userGroupMember.count({
        where: {
          userId: params.ownerUserId,
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

    const targetPrice = this.parsePositiveDecimal(
      params.input.targetPrice,
      "قیمت هدف"
    );
    const weightGrams = this.parsePositiveDecimal(
      params.input.weightGrams,
      "مقدار / وزن"
    );

    if (weightGrams.lt(product.minOrder) || weightGrams.gt(product.maxOrder)) {
      throw new BadRequestException(
        `مقدار پیش‌سفارش باید بین ${product.minOrder.toString()} و ${product.maxOrder.toString()} ${product.unit} باشد`
      );
    }

    const totalAmount = weightGrams
      .mul(targetPrice)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
    const feeAmount = totalAmount
      .mul("0.001")
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

    const expiresAt = getEndOfTehranDay();

    const preOrder = await this.prisma.preOrder.create({
      data: {
        userId: params.ownerUserId,
        productId: product.id,
        createdByAdminId: params.createdByAdminId,
        side,
        targetPrice,
        weightGrams,
        feeAmount,
        totalAmount,
        status: PreOrderStatus.ACTIVE,
        isManual: params.isManual,
        expiresAt,
      },
      include: {
        product: { select: { id: true, name: true, unit: true, badge: true } },
        user: { select: { id: true, fullName: true, username: true } },
        createdByAdmin: { select: { id: true, fullName: true } },
      },
    });

    return { preOrder };
  }

  async createUserPreOrder(user: SessionUser, input: CreatePreOrderInput) {
    const isAdmin =
      user.role.code === "ADMIN" || user.role.code === "SYSTEM_MANAGER";
    return this.createValidatedPreOrder({
      ownerUserId: user.id,
      enforceGroupAccess: !isAdmin,
      createdByAdminId: null,
      isManual: false,
      input,
    });
  }

  async createManualPreOrder(
    admin: SessionUser,
    input: CreateManualPreOrderInput
  ) {
    const userId = input.userId?.trim() ?? "";
    if (!userId) {
      throw new BadRequestException("انتخاب کاربر الزامی است");
    }
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });
    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundException("کاربر مورد نظر یافت نشد یا غیرفعال است");
    }

    return this.createValidatedPreOrder({
      ownerUserId: targetUser.id,
      enforceGroupAccess: false,
      createdByAdminId: admin.id,
      isManual: true,
      input,
    });
  }

  async listMyPreOrders(
    userId: string,
    filters: { range?: string; status?: string; search?: string }
  ) {
    const now = new Date();
    let sinceDate: Date | undefined;
    if (filters.range === "today") {
      const tehranDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      sinceDate = new Date(`${tehranDate}T00:00:00.000+03:30`);
    } else if (filters.range === "3days") {
      sinceDate = new Date(now.getTime() - 3 * 86_400_000);
    } else if (filters.range === "7days") {
      sinceDate = new Date(now.getTime() - 7 * 86_400_000);
    } else if (filters.range === "month") {
      sinceDate = new Date(now.getTime() - 30 * 86_400_000);
    }

    const statusUpper = filters.status?.trim().toUpperCase();
    const validStatuses = new Set(["ACTIVE", "EXECUTED", "CANCELLED", "EXPIRED"]);
    const statusFilter =
      statusUpper && validStatuses.has(statusUpper)
        ? (statusUpper as PreOrderStatus)
        : undefined;

    const search = filters.search?.trim();

    return this.prisma.preOrder.findMany({
      where: {
        userId,
        ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search
          ? { product: { name: { contains: search, mode: "insensitive" } } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, unit: true, badge: true } },
      },
    });
  }

  async cancelPreOrder(userId: string, id: string) {
    const existing = await this.prisma.preOrder.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("پیش‌سفارش یافت نشد");
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("شما مجاز به لغو این پیش‌سفارش نیستید");
    }
    if (existing.status !== PreOrderStatus.ACTIVE) {
      throw new BadRequestException("فقط پیش‌سفارش‌های فعال قابل لغو هستند");
    }

    return this.prisma.preOrder.update({
      where: { id },
      data: { status: PreOrderStatus.CANCELLED },
      include: {
        product: { select: { id: true, name: true, unit: true, badge: true } },
      },
    });
  }

  async evaluateTriggersForProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) return;

    const stoppedSetting = await this.prisma.setting.findUnique({
      where: { key: "trading_stopped" },
    });
    if (stoppedSetting?.value === "true") return;

    const timeoutSetting = await this.prisma.setting.findUnique({
      where: { key: "response_timeout_seconds" },
    });
    const timeoutSec = Number(timeoutSetting?.value ?? "60");
    const effectiveTimeout =
      Number.isFinite(timeoutSec) && timeoutSec > 0 ? timeoutSec : 60;

    const now = new Date();
    const activePreOrders = await this.prisma.preOrder.findMany({
      where: {
        productId,
        status: PreOrderStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "asc" },
    });

    for (const po of activePreOrders) {
      const shouldTrigger =
        (po.side === TradeSide.BUY && product.sellPrice.lte(po.targetPrice)) ||
        (po.side === TradeSide.SELL && product.buyPrice.gte(po.targetPrice));

      if (!shouldTrigger) continue;

      try {
        const triggered = await this.prisma.$transaction(async (tx) => {
          const rows = await tx.$queryRaw<LockedPreOrderRow[]>`
            SELECT id, "userId", "productId", side, "targetPrice", "weightGrams", status, "expiresAt"
            FROM "pre_orders"
            WHERE id = ${po.id}
            FOR UPDATE
          `;
          const locked = rows[0];
          if (!locked || locked.status !== PreOrderStatus.ACTIVE) {
            return null;
          }
          if (locked.expiresAt && locked.expiresAt.getTime() <= Date.now()) {
            return null;
          }

          await tx.preOrder.update({
            where: { id: locked.id },
            data: { status: PreOrderStatus.EXECUTED },
          });

          const unitPrice =
            locked.side === TradeSide.BUY
              ? product.sellPrice
              : product.buyPrice;
          const totalAmount = locked.weightGrams
            .mul(unitPrice)
            .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
          const quoteCode = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(
            100 + Math.random() * 900
          )}`;
          const expiresAt = new Date(Date.now() + effectiveTimeout * 1000);

          const order = await tx.order.create({
            data: {
              quoteCode,
              userId: locked.userId,
              productId: product.id,
              side: locked.side,
              quantity: locked.weightGrams,
              unitPrice,
              totalAmount,
              status: OrderStatus.PENDING_APPROVAL,
              expiresAt,
            },
            include: {
              product: { select: { id: true, name: true, unit: true } },
              user: { select: { id: true, fullName: true } },
            },
          });

          await tx.notification.create({
            data: {
              userId: locked.userId,
              title: "اجرای پیش‌سفارش شرطی",
              body: `پیش‌سفارش ${product.name} با قیمت هدف ${locked.targetPrice.toFixed(
                0
              )} تومان فعال شد و سفارش ${order.quoteCode} در انتظار تایید مدیر ثبت گردید.`,
              priorityColor: NotificationColor.GOLD,
            },
          });

          return { preOrderId: locked.id, order };
        });

        if (triggered) {
          const { order } = triggered;
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

          this.realtime.broadcastPreOrderUpdated({
            id: triggered.preOrderId,
            userId: order.userId,
            productId: order.productId,
            status: PreOrderStatus.EXECUTED,
            orderId: order.id,
            quoteCode: order.quoteCode,
          });
        }
      } catch (err) {
        this.logger.warn(`PreOrder trigger error ${po.id}: ${String(err)}`);
      }
    }
  }

  async expireOverduePreOrders() {
    if (this.isExpiring) return;
    this.isExpiring = true;
    try {
      const overdue = await this.prisma.preOrder.findMany({
        where: {
          status: PreOrderStatus.ACTIVE,
          expiresAt: { lte: new Date() },
        },
        select: { id: true },
        take: 25,
      });

      for (const item of overdue) {
        try {
          const expired = await this.prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<LockedPreOrderRow[]>`
              SELECT id, "userId", "productId", side, "targetPrice", "weightGrams", status, "expiresAt"
              FROM "pre_orders"
              WHERE id = ${item.id}
              FOR UPDATE
            `;
            const locked = rows[0];
            if (
              !locked ||
              locked.status !== PreOrderStatus.ACTIVE ||
              !locked.expiresAt ||
              locked.expiresAt.getTime() > Date.now()
            ) {
              return null;
            }

            const updated = await tx.preOrder.update({
              where: { id: locked.id },
              data: { status: PreOrderStatus.EXPIRED },
              include: { product: { select: { name: true } } },
            });

            await tx.notification.create({
              data: {
                userId: updated.userId,
                title: "انقضای پیش‌سفارش",
                body: `اعتبار روزانه پیش‌سفارش ${updated.product.name} به پایان رسید.`,
                priorityColor: NotificationColor.RED,
              },
            });

            return updated;
          });

          if (expired) {
            this.realtime.broadcastPreOrderUpdated({
              id: expired.id,
              userId: expired.userId,
              productId: expired.productId,
              status: PreOrderStatus.EXPIRED,
            });
          }
        } catch (err) {
          this.logger.warn(`PreOrder expire error ${item.id}: ${String(err)}`);
        }
      }
    } finally {
      this.isExpiring = false;
    }
  }
}
