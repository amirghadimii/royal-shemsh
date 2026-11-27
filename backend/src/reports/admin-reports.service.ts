import { Inject, Injectable } from "@nestjs/common";
import {
  LedgerEntryType,
  Prisma,
  TradeSide,
  TradeStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CUSTOMER_PL_SOURCE,
  type CustomerPlSource,
} from "./customer-pl.source";

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CUSTOMER_PL_SOURCE)
    private readonly customerPlSource: CustomerPlSource
  ) {}

  async getProfitLoss(daysRaw?: string) {
    const days = Number(daysRaw ?? "30");
    const since =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() - days * 86_400_000)
        : undefined;

    const [products, trades] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.trade.findMany({
        where: {
          status: TradeStatus.APPROVED,
          ...(since ? { createdAt: { gte: since } } : {}),
        },
      }),
    ]);

    const byProd = new Map<
      string,
      {
        buyTotal: Prisma.Decimal;
        sellTotal: Prisma.Decimal;
        buyWeight: Prisma.Decimal;
        sellWeight: Prisma.Decimal;
      }
    >();

    for (const t of trades) {
      const b = byProd.get(t.productId) ?? {
        buyTotal: new Prisma.Decimal(0),
        sellTotal: new Prisma.Decimal(0),
        buyWeight: new Prisma.Decimal(0),
        sellWeight: new Prisma.Decimal(0),
      };
      if (t.side === TradeSide.BUY) {
        b.buyTotal = b.buyTotal.plus(t.totalAmount);
        b.buyWeight = b.buyWeight.plus(t.quantity);
      } else {
        b.sellTotal = b.sellTotal.plus(t.totalAmount);
        b.sellWeight = b.sellWeight.plus(t.quantity);
      }
      byProd.set(t.productId, b);
    }

    const rows = products.map((p) => {
      const b = byProd.get(p.id) ?? {
        buyTotal: new Prisma.Decimal(0),
        sellTotal: new Prisma.Decimal(0),
        buyWeight: new Prisma.Decimal(0),
        sellWeight: new Prisma.Decimal(0),
      };
      const netWeight = b.buyWeight.minus(b.sellWeight);
      const netPl = b.sellTotal.minus(b.buyTotal);
      return {
        productId: p.id,
        name: p.name,
        unit: p.unit,
        buyTotalToman: b.buyTotal.toFixed(0),
        sellTotalToman: b.sellTotal.toFixed(0),
        buyWeight: b.buyWeight.toString(),
        sellWeight: b.sellWeight.toString(),
        netWeight: netWeight.toString(),
        totalPlToman: netPl.toFixed(0),
      };
    });

    const grandTotalPl = rows.reduce(
      (s, r) => s.plus(r.totalPlToman),
      new Prisma.Decimal(0)
    );

    return {
      rows,
      grandTotalPlToman: grandTotalPl.toFixed(0),
    };
  }

  async getAssetDashboard() {
    const [products, trades] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.trade.findMany({
        where: { status: TradeStatus.APPROVED },
      }),
    ]);

    const byProd = new Map<
      string,
      {
        buyWeight: Prisma.Decimal;
        sellWeight: Prisma.Decimal;
        buyTotal: Prisma.Decimal;
        sellTotal: Prisma.Decimal;
      }
    >();

    for (const t of trades) {
      const b = byProd.get(t.productId) ?? {
        buyWeight: new Prisma.Decimal(0),
        sellWeight: new Prisma.Decimal(0),
        buyTotal: new Prisma.Decimal(0),
        sellTotal: new Prisma.Decimal(0),
      };
      if (t.side === TradeSide.BUY) {
        b.buyWeight = b.buyWeight.plus(t.quantity);
        b.buyTotal = b.buyTotal.plus(t.totalAmount);
      } else {
        b.sellWeight = b.sellWeight.plus(t.quantity);
        b.sellTotal = b.sellTotal.plus(t.totalAmount);
      }
      byProd.set(t.productId, b);
    }

    const rows = products.map((p) => {
      const b = byProd.get(p.id) ?? {
        buyWeight: new Prisma.Decimal(0),
        sellWeight: new Prisma.Decimal(0),
        buyTotal: new Prisma.Decimal(0),
        sellTotal: new Prisma.Decimal(0),
      };
      const netPosition = b.buyWeight.minus(b.sellWeight);
      const realisedPl = b.sellTotal.minus(b.buyTotal);
      const valuationPrice = p.buyPrice;
      const floatingPl = netPosition
        .mul(valuationPrice)
        .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
      const totalPl = realisedPl.plus(floatingPl);

      return {
        productId: p.id,
        name: p.name,
        unit: p.unit,
        buyWeight: b.buyWeight.toString(),
        sellWeight: b.sellWeight.toString(),
        netPosition: netPosition.toString(),
        valuationPrice: valuationPrice.toFixed(0),
        realisedPlToman: realisedPl.toFixed(0),
        floatingPlToman: floatingPl.toFixed(0),
        totalPlToman: totalPl.toFixed(0),
      };
    });

    const totalFloatingPl = rows.reduce(
      (s, r) => s.plus(r.floatingPlToman),
      new Prisma.Decimal(0)
    );
    const totalRealisedPl = rows.reduce(
      (s, r) => s.plus(r.realisedPlToman),
      new Prisma.Decimal(0)
    );

    return {
      rows,
      totalFloatingPlToman: totalFloatingPl.toFixed(0),
      totalRealisedPlToman: totalRealisedPl.toFixed(0),
    };
  }

  async getCustomerPl(filters: { search?: string; filter?: string }) {
    return this.customerPlSource.getCustomerPl(filters);
  }

  async getCommissionReport(filters: {
    from?: string;
    to?: string;
    userId?: string;
  }) {
    const fromDate = filters.from ? new Date(filters.from) : undefined;
    const toDate = filters.to ? new Date(filters.to) : undefined;
    const createdAtFilter =
      (fromDate && !Number.isNaN(fromDate.getTime())) ||
      (toDate && !Number.isNaN(toDate.getTime()))
        ? {
            ...(fromDate && !Number.isNaN(fromDate.getTime())
              ? { gte: fromDate }
              : {}),
            ...(toDate && !Number.isNaN(toDate.getTime())
              ? { lte: toDate }
              : {}),
          }
        : undefined;

    const [groups, trades] = await Promise.all([
      this.prisma.userGroup.findMany({
        where: { isActive: true },
        orderBy: { number: "asc" },
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, code: true } },
            },
          },
        },
      }),
      this.prisma.trade.findMany({
        where: {
          status: TradeStatus.APPROVED,
          ...(filters.userId ? { userId: filters.userId } : {}),
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),
    ]);

    const weightByUser = new Map<string, Prisma.Decimal>();
    for (const t of trades) {
      weightByUser.set(
        t.userId,
        (weightByUser.get(t.userId) ?? new Prisma.Decimal(0)).plus(t.quantity)
      );
    }

    let grandTotal = new Prisma.Decimal(0);
    const groupRows = groups
      .map((g) => {
        const rate = g.commissionRateToman;
        const members = g.members
          .filter((m) => !filters.userId || m.userId === filters.userId)
          .map((m) => {
            const weight = weightByUser.get(m.userId) ?? new Prisma.Decimal(0);
            const commission = weight
              .mul(rate)
              .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
            return {
              userId: m.userId,
              name: m.user.fullName,
              code: m.user.code,
              tradedWeight: weight.toString(),
              ratePerGramToman: rate.toFixed(0),
              commissionToman: commission.toFixed(0),
            };
          });

        const groupTotal = members.reduce(
          (s, m) => s.plus(m.commissionToman),
          new Prisma.Decimal(0)
        );
        grandTotal = grandTotal.plus(groupTotal);

        return {
          groupId: g.id,
          groupNumber: g.number,
          groupName: g.name,
          leaderName: g.leaderName ?? g.name,
          ratePerGramToman: rate.toFixed(0),
          members,
          groupTotalToman: groupTotal.toFixed(0),
        };
      })
      .filter((g) => g.members.length > 0);

    return {
      groups: groupRows,
      grandTotalToman: grandTotal.toFixed(0),
    };
  }

  async getDiscrepancyReport(filters: {
    range?: string;
    from?: string;
    to?: string;
    userId?: string;
    productId?: string;
  }) {
    const now = new Date();
    let gte: Date | undefined;
    let lte: Date | undefined;
    if (filters.from) {
      const d = new Date(filters.from);
      if (!Number.isNaN(d.getTime())) gte = d;
    } else if (filters.range === "today") {
      const tehranDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      gte = new Date(`${tehranDate}T00:00:00.000+03:30`);
    } else if (filters.range === "3days") {
      gte = new Date(now.getTime() - 3 * 86_400_000);
    } else if (filters.range === "7days") {
      gte = new Date(now.getTime() - 7 * 86_400_000);
    }
    if (filters.to) {
      const d = new Date(filters.to);
      if (!Number.isNaN(d.getTime())) lte = d;
    }
    const createdAtFilter =
      gte || lte ? { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } : undefined;

    const [trades, ledgerEntries, users, products] = await Promise.all([
      this.prisma.trade.findMany({
        where: {
          status: TradeStatus.APPROVED,
          ...(filters.userId ? { userId: filters.userId } : {}),
          ...(filters.productId ? { productId: filters.productId } : {}),
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      }),
      this.prisma.ledgerEntry.findMany({
        where: {
          user: { username: { not: "system_treasury" } },
          tradeId: { not: null },
          ...(filters.userId ? { userId: filters.userId } : {}),
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
          entryType: { in: [LedgerEntryType.GOLD_IN, LedgerEntryType.GOLD_OUT] },
        },
        include: { trade: { select: { productId: true } } },
      }),
      this.prisma.user.findMany({ select: { id: true, fullName: true, code: true } }),
      this.prisma.product.findMany({ select: { id: true, name: true, unit: true } }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const prodMap = new Map(products.map((p) => [p.id, p]));

    const tradePos = new Map<string, Prisma.Decimal>();
    for (const t of trades) {
      const key = `${t.userId}::${t.productId}`;
      const delta = t.side === TradeSide.BUY ? t.quantity : t.quantity.negated();
      tradePos.set(key, (tradePos.get(key) ?? new Prisma.Decimal(0)).plus(delta));
    }

    const ledgerPos = new Map<string, Prisma.Decimal>();
    for (const l of ledgerEntries) {
      const pid = l.productId ?? l.trade?.productId;
      if (!pid) continue;
      if (filters.productId && pid !== filters.productId) continue;
      const key = `${l.userId}::${pid}`;
      const delta =
        l.entryType === LedgerEntryType.GOLD_IN
          ? l.goldGrams
          : l.goldGrams.negated();
      ledgerPos.set(
        key,
        (ledgerPos.get(key) ?? new Prisma.Decimal(0)).plus(delta)
      );
    }

    const allKeys = new Set([...tradePos.keys(), ...ledgerPos.keys()]);
    const discrepancies: {
      userId: string;
      userName: string;
      productId: string;
      productName: string;
      tradesPosition: string;
      ledgerPosition: string;
      difference: string;
    }[] = [];

    for (const key of allKeys) {
      const [userId, productId] = key.split("::");
      const tp = tradePos.get(key) ?? new Prisma.Decimal(0);
      const lp = ledgerPos.get(key) ?? new Prisma.Decimal(0);
      if (!tp.eq(lp)) {
        const u = userMap.get(userId);
        const p = prodMap.get(productId);
        discrepancies.push({
          userId,
          userName: u?.fullName ?? userId,
          productId,
          productName: p?.name ?? productId,
          tradesPosition: tp.toString(),
          ledgerPosition: lp.toString(),
          difference: lp.minus(tp).toString(),
        });
      }
    }

    return {
      isConsistent: discrepancies.length === 0,
      discrepancies,
    };
  }

  async getOrderBalance(dateStr?: string) {
    const cleanDate = dateStr?.trim();
    const targetDay =
      cleanDate && /^\d{4}-\d{2}-\d{2}$/.test(cleanDate)
        ? cleanDate
        : new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Tehran",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date());
    const cutoff = new Date(`${targetDay}T23:59:59.999+03:30`);

    const [products, trades] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.trade.findMany({
        where: {
          status: TradeStatus.APPROVED,
          createdAt: { lte: cutoff },
        },
      }),
    ]);

    const byProd = new Map<
      string,
      { buy: Prisma.Decimal; sell: Prisma.Decimal }
    >();
    for (const t of trades) {
      const b = byProd.get(t.productId) ?? {
        buy: new Prisma.Decimal(0),
        sell: new Prisma.Decimal(0),
      };
      if (t.side === TradeSide.BUY) b.buy = b.buy.plus(t.quantity);
      else b.sell = b.sell.plus(t.quantity);
      byProd.set(t.productId, b);
    }

    const rows = products.map((p) => {
      const b = byProd.get(p.id) ?? {
        buy: new Prisma.Decimal(0),
        sell: new Prisma.Decimal(0),
      };
      return {
        productId: p.id,
        name: p.name,
        unit: p.unit,
        buyWeight: b.buy.toString(),
        sellWeight: b.sell.toString(),
        netWeight: b.buy.minus(b.sell).toString(),
      };
    });

    return {
      date: targetDay,
      cutoff: cutoff.toISOString(),
      rows,
    };
  }
}
