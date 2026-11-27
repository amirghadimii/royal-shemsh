import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  LedgerEntryType,
  Prisma,
  RemittanceStatus,
  RemittanceType,
} from "@prisma/client";
import { normalizeDigits } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateRemittanceInput {
  userId?: string;
  type?: string;
  productId?: string;
  weightGrams?: string | number;
  cashAmount?: string | number;
  warehouse?: string;
  barcodeNote?: string;
  remittanceCode?: string;
}

@Injectable()
export class RemittancesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRemittance(input: CreateRemittanceInput) {
    const userId = input.userId?.trim() ?? "";
    if (!userId) throw new BadRequestException("انتخاب کاربر الزامی است");

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("کاربر یافت نشد");

    const typeRaw = (input.type ?? "").trim().toUpperCase();
    const remType =
      typeRaw === "GOLD" || typeRaw === "GOLD_WEIGHT"
        ? RemittanceType.GOLD_WEIGHT
        : typeRaw === "CASH" || typeRaw === "CASH_RIAL"
          ? RemittanceType.CASH_RIAL
          : null;
    if (!remType) {
      throw new BadRequestException("نوع حواله معتبر نیست (GOLD_WEIGHT یا CASH_RIAL)");
    }

    let productId: string | null = null;
    let weightGrams = new Prisma.Decimal(0);
    let cashAmount = new Prisma.Decimal(0);

    if (remType === RemittanceType.GOLD_WEIGHT) {
      productId = input.productId?.trim() || null;
      if (!productId) {
        const firstProd = await this.prisma.product.findFirst({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        });
        productId = firstProd?.id ?? null;
      }
      if (!productId) {
        throw new BadRequestException("انتخاب کالا برای حواله وزنی الزامی است");
      }
      const cleanW = normalizeDigits(String(input.weightGrams ?? "")).trim();
      weightGrams = new Prisma.Decimal(cleanW || "0");
      if (!weightGrams.isFinite() || weightGrams.lte(0)) {
        throw new BadRequestException("وزن حواله باید بزرگ‌تر از صفر باشد");
      }
    } else {
      const cleanC = normalizeDigits(String(input.cashAmount ?? "")).trim();
      cashAmount = new Prisma.Decimal(cleanC || "0");
      if (!cashAmount.isFinite() || cashAmount.lte(0)) {
        throw new BadRequestException("مبلغ حواله نقدی باید بزرگ‌تر از صفر باشد");
      }
    }

    const remittanceCode =
      input.remittanceCode?.trim() ||
      `REM-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        100 + Math.random() * 900
      )}`;
    const warehouse = input.warehouse?.trim() || "خزانه مرکزی رویال شمش";

    return this.prisma.$transaction(async (tx) => {
      const rem = await tx.remittance.create({
        data: {
          remittanceCode,
          userId,
          productId,
          type: remType,
          weightGrams,
          cashAmount,
          warehouse,
          barcodeNote: input.barcodeNote?.trim() || null,
          status: RemittanceStatus.COMPLETED,
        },
        include: {
          user: { select: { id: true, code: true, fullName: true } },
          product: { select: { id: true, name: true, unit: true } },
        },
      });

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

      const docPrefix = `DOC-${rem.remittanceCode}`;
      if (remType === RemittanceType.GOLD_WEIGHT) {
        await tx.ledgerEntry.createMany({
          data: [
            {
              documentNumber: `${docPrefix}-UG`,
              userId,
              productId,
              entryType: LedgerEntryType.GOLD_IN,
              rialAmount: new Prisma.Decimal(0),
              goldGrams: weightGrams,
              description: `حواله طلایی ${rem.remittanceCode} (${warehouse})`,
              isFinalized: true,
            },
            {
              documentNumber: `${docPrefix}-TG`,
              userId: treasury.id,
              productId,
              entryType: LedgerEntryType.GOLD_OUT,
              rialAmount: new Prisma.Decimal(0),
              goldGrams: weightGrams,
              description: `طرف خزانه حواله ${rem.remittanceCode}`,
              isFinalized: true,
            },
          ],
        });
      } else {
        await tx.ledgerEntry.createMany({
          data: [
            {
              documentNumber: `${docPrefix}-UC`,
              userId,
              entryType: LedgerEntryType.CREDIT,
              rialAmount: cashAmount,
              goldGrams: new Prisma.Decimal(0),
              description: `حواله وجه نقد ${rem.remittanceCode} (${warehouse})`,
              isFinalized: true,
            },
            {
              documentNumber: `${docPrefix}-TC`,
              userId: treasury.id,
              entryType: LedgerEntryType.DEBIT,
              rialAmount: cashAmount,
              goldGrams: new Prisma.Decimal(0),
              description: `طرف خزانه حواله وجه ${rem.remittanceCode}`,
              isFinalized: true,
            },
          ],
        });
      }

      return rem;
    });
  }

  async listRemittances(filters: { userId?: string; type?: string }) {
    const typeUpper = filters.type?.trim().toUpperCase();
    const typeFilter =
      typeUpper === "GOLD_WEIGHT" || typeUpper === "CASH_RIAL"
        ? (typeUpper as RemittanceType)
        : undefined;

    return this.prisma.remittance.findMany({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, code: true, fullName: true } },
        product: { select: { id: true, name: true, unit: true } },
      },
    });
  }
}
