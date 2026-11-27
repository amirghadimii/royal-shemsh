import { Injectable } from "@nestjs/common";
import { LedgerEntryType, Prisma } from "@prisma/client";
import { normalizeDigits } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";

function parseDateFilter(filters: {
  range?: string;
  from?: string;
  to?: string;
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
  } else if (filters.range === "week") {
    gte = new Date(now.getTime() - 7 * 86_400_000);
  } else if (filters.range === "month") {
    gte = new Date(now.getTime() - 30 * 86_400_000);
  }

  if (filters.to) {
    const d = new Date(filters.to);
    if (!Number.isNaN(d.getTime())) lte = d;
  }

  return gte || lte ? { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } : undefined;
}

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyAccounting(
    userId: string,
    filters: { range?: string; from?: string; to?: string }
  ) {
    const createdAtFilter = parseDateFilter(filters);

    // Balances are ALWAYS derived from all ledger entries for this user
    const allEntries = await this.prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, code: true, name: true, unit: true } },
        trade: {
          select: {
            id: true,
            tradeCode: true,
            productId: true,
            product: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
      },
    });

    let cashDec = new Prisma.Decimal(0);
    let goldDec = new Prisma.Decimal(0);
    const perProductMap = new Map<
      string,
      { productId: string; name: string; unit: string; weight: Prisma.Decimal }
    >();

    for (const e of allEntries) {
      if (e.entryType === LedgerEntryType.CREDIT) {
        cashDec = cashDec.plus(e.rialAmount);
      } else if (e.entryType === LedgerEntryType.DEBIT) {
        cashDec = cashDec.minus(e.rialAmount);
      } else if (e.entryType === LedgerEntryType.GOLD_IN) {
        goldDec = goldDec.plus(e.goldGrams);
      } else if (e.entryType === LedgerEntryType.GOLD_OUT) {
        goldDec = goldDec.minus(e.goldGrams);
      }

      const prodObj = e.product ?? e.trade?.product;
      if (
        prodObj &&
        (e.entryType === LedgerEntryType.GOLD_IN ||
          e.entryType === LedgerEntryType.GOLD_OUT)
      ) {
        const p = prodObj;
        const cur = perProductMap.get(p.id) ?? {
          productId: p.id,
          name: p.name,
          unit: p.unit,
          weight: new Prisma.Decimal(0),
        };
        cur.weight =
          e.entryType === LedgerEntryType.GOLD_IN
            ? cur.weight.plus(e.goldGrams)
            : cur.weight.minus(e.goldGrams);
        perProductMap.set(p.id, cur);
      }
    }

    const filteredEntries = createdAtFilter
      ? await this.prisma.ledgerEntry.findMany({
          where: { userId, createdAt: createdAtFilter },
          orderBy: { createdAt: "desc" },
          include: {
            trade: {
              select: {
                id: true,
                tradeCode: true,
                product: { select: { id: true, name: true, unit: true } },
              },
            },
          },
        })
      : allEntries;

    return {
      summary: {
        cashBalanceToman: cashDec.toFixed(0),
        totalGoldGrams: goldDec.toString(),
        perProduct: Array.from(perProductMap.values()).map((p) => ({
          productId: p.productId,
          name: p.name,
          unit: p.unit,
          weight: p.weight.toString(),
        })),
      },
      entries: filteredEntries,
    };
  }

  async getAdminAccounting(filters: { search?: string; filter?: string }) {
    const search = filters.search?.trim();
    const searchAscii = search ? normalizeDigits(search) : "";
    const filterType = (filters.filter ?? "all").toLowerCase();

    const users = await this.prisma.user.findMany({
      where: {
        username: { not: "system_treasury" },
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
                ...( /^\d+$/.test(searchAscii) ? [{ code: Number(searchAscii) }] : []),
              ],
            }
          : {}),
      },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        username: true,
        fullName: true,
        isActive: true,
      },
    });

    const entries = await this.prisma.ledgerEntry.findMany({
      where: { userId: { in: users.map((u) => u.id) } },
      include: {
        product: { select: { id: true, code: true, name: true } },
        trade: {
          select: {
            product: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    const byUser = new Map<
      string,
      {
        cash: Prisma.Decimal;
        gold: Prisma.Decimal;
        byProductName: Map<string, Prisma.Decimal>;
      }
    >();

    for (const u of users) {
      byUser.set(u.id, {
        cash: new Prisma.Decimal(0),
        gold: new Prisma.Decimal(0),
        byProductName: new Map(),
      });
    }

    for (const e of entries) {
      const bucket = byUser.get(e.userId);
      if (!bucket) continue;
      if (e.entryType === LedgerEntryType.CREDIT) {
        bucket.cash = bucket.cash.plus(e.rialAmount);
      } else if (e.entryType === LedgerEntryType.DEBIT) {
        bucket.cash = bucket.cash.minus(e.rialAmount);
      } else if (e.entryType === LedgerEntryType.GOLD_IN) {
        bucket.gold = bucket.gold.plus(e.goldGrams);
      } else if (e.entryType === LedgerEntryType.GOLD_OUT) {
        bucket.gold = bucket.gold.minus(e.goldGrams);
      }

      const prodObj = e.product ?? e.trade?.product;
      if (
        prodObj &&
        (e.entryType === LedgerEntryType.GOLD_IN ||
          e.entryType === LedgerEntryType.GOLD_OUT)
      ) {
        const pName = prodObj.name;
        const cur = bucket.byProductName.get(pName) ?? new Prisma.Decimal(0);
        bucket.byProductName.set(
          pName,
          e.entryType === LedgerEntryType.GOLD_IN
            ? cur.plus(e.goldGrams)
            : cur.minus(e.goldGrams)
        );
      }
    }

    const pickProductWeight = (
      map: Map<string, Prisma.Decimal>,
      keyword: string
    ) => {
      let sum = new Prisma.Decimal(0);
      for (const [name, val] of map.entries()) {
        if (name.includes(keyword)) sum = sum.plus(val);
      }
      return sum.toString();
    };

    const rows = users
      .map((u) => {
        const b = byUser.get(u.id)!;
        const cashStr = b.cash.toFixed(0);
        const cashNum = Number(cashStr);
        return {
          id: u.id,
          code: u.code,
          username: u.username,
          name: u.fullName,
          cashBalanceToman: cashStr,
          isCreditor: cashNum > 0,
          isDebtor: cashNum < 0,
          goldGrams: b.gold.toString(),
          naghdeFarda: pickProductWeight(b.byProductName, "نقد فردا"),
          emami86: pickProductWeight(b.byProductName, "امامی"),
          nimSekkeh: pickProductWeight(b.byProductName, "نیم سکه"),
          usd: pickProductWeight(b.byProductName, "دلار"),
          euro: pickProductWeight(b.byProductName, "یورو"),
          aed: pickProductWeight(b.byProductName, "درهم"),
        };
      })
      .filter((r) => {
        if (filterType === "creditor") return r.isCreditor;
        if (filterType === "debtor") return r.isDebtor;
        return true;
      });

    return { rows };
  }

  async buildCsvExport(userId?: string): Promise<string> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: userId ? { userId } : { user: { username: { not: "system_treasury" } } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { code: true, fullName: true, username: true } },
        trade: { select: { tradeCode: true, product: { select: { name: true } } } },
      },
    });

    const header = [
      "DocumentNumber",
      "UserCode",
      "UserName",
      "EntryType",
      "RialAmountToman",
      "GoldGrams",
      "Product",
      "TradeCode",
      "Description",
      "CreatedAt",
    ].join(",");

    const escapeCsv = (val: unknown) =>
      `"${String(val ?? "").replace(/"/g, '""')}"`;

    const lines = entries.map((e) =>
      [
        escapeCsv(e.documentNumber),
        escapeCsv(e.user.code),
        escapeCsv(e.user.fullName),
        escapeCsv(e.entryType),
        escapeCsv(e.rialAmount.toFixed(0)),
        escapeCsv(e.goldGrams.toString()),
        escapeCsv(e.trade?.product?.name ?? ""),
        escapeCsv(e.trade?.tradeCode ?? ""),
        escapeCsv(e.description),
        escapeCsv(e.createdAt.toISOString()),
      ].join(",")
    );

    return `\uFEFF${[header, ...lines].join("\n")}`;
  }
}
