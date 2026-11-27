import { Injectable } from "@nestjs/common";
import { LedgerEntryType, Prisma } from "@prisma/client";
import { normalizeDigits } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";

export const CUSTOMER_PL_SOURCE = "CUSTOMER_PL_SOURCE";

export interface CustomerPlRow {
  userId: string;
  code: number;
  username: string;
  name: string;
  cashBalanceToman: string;
  goldGrams: string;
  profitLossToman: string;
  naghdeFarda: string;
  emami86: string;
  nimSekkeh: string;
  usd: string;
  euro: string;
  aed: string;
}

export interface CustomerPlSource {
  getCustomerPl(filters: {
    search?: string;
    filter?: string;
  }): Promise<{ sourceName: string; rows: CustomerPlRow[] }>;
}

/**
 * Staging local-ledger implementation of CustomerPlSource.
 * In production, a Kimia adapter can implement CustomerPlSource and replace this provider.
 */
@Injectable()
export class LocalLedgerCustomerPlSource implements CustomerPlSource {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerPl(filters: { search?: string; filter?: string }) {
    const search = filters.search?.trim();
    const searchAscii = search ? normalizeDigits(search) : "";
    const filterType = (filters.filter ?? "all").toLowerCase();

    const [users, products, entries] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          username: { not: "system_treasury" },
          ...(search
            ? {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  { username: { contains: search, mode: "insensitive" } },
                  ...(/^\d+$/.test(searchAscii)
                    ? [{ code: Number(searchAscii) }]
                    : []),
                ],
              }
            : {}),
        },
        orderBy: { code: "asc" },
        select: { id: true, code: true, username: true, fullName: true },
      }),
      this.prisma.product.findMany({
        select: { id: true, name: true, buyPrice: true },
      }),
      this.prisma.ledgerEntry.findMany({
        where: { user: { username: { not: "system_treasury" } } },
        include: {
          product: { select: { id: true, name: true } },
          trade: { select: { product: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    const productPriceMap = new Map(products.map((p) => [p.id, p.buyPrice]));

    const byUser = new Map<
      string,
      {
        cash: Prisma.Decimal;
        gold: Prisma.Decimal;
        byProdId: Map<string, Prisma.Decimal>;
        byProdName: Map<string, Prisma.Decimal>;
      }
    >();

    for (const u of users) {
      byUser.set(u.id, {
        cash: new Prisma.Decimal(0),
        gold: new Prisma.Decimal(0),
        byProdId: new Map(),
        byProdName: new Map(),
      });
    }

    for (const e of entries) {
      const b = byUser.get(e.userId);
      if (!b) continue;
      if (e.entryType === LedgerEntryType.CREDIT) {
        b.cash = b.cash.plus(e.rialAmount);
      } else if (e.entryType === LedgerEntryType.DEBIT) {
        b.cash = b.cash.minus(e.rialAmount);
      } else if (e.entryType === LedgerEntryType.GOLD_IN) {
        b.gold = b.gold.plus(e.goldGrams);
      } else if (e.entryType === LedgerEntryType.GOLD_OUT) {
        b.gold = b.gold.minus(e.goldGrams);
      }

      const prod = e.product ?? e.trade?.product;
      if (
        prod &&
        (e.entryType === LedgerEntryType.GOLD_IN ||
          e.entryType === LedgerEntryType.GOLD_OUT)
      ) {
        const delta =
          e.entryType === LedgerEntryType.GOLD_IN
            ? e.goldGrams
            : e.goldGrams.negated();
        b.byProdId.set(
          prod.id,
          (b.byProdId.get(prod.id) ?? new Prisma.Decimal(0)).plus(delta)
        );
        b.byProdName.set(
          prod.name,
          (b.byProdName.get(prod.name) ?? new Prisma.Decimal(0)).plus(delta)
        );
      }
    }

    const pick = (map: Map<string, Prisma.Decimal>, kw: string) => {
      let sum = new Prisma.Decimal(0);
      for (const [k, v] of map.entries()) {
        if (k.includes(kw)) sum = sum.plus(v);
      }
      return sum.toString();
    };

    const rows: CustomerPlRow[] = users
      .map((u) => {
        const b = byUser.get(u.id)!;
        let markToMarket = new Prisma.Decimal(0);
        for (const [pid, qty] of b.byProdId.entries()) {
          const price = productPriceMap.get(pid) ?? new Prisma.Decimal(0);
          markToMarket = markToMarket.plus(qty.mul(price));
        }
        const pl = b.cash.plus(markToMarket).toDecimalPlaces(0);
        return {
          userId: u.id,
          code: u.code,
          username: u.username,
          name: u.fullName,
          cashBalanceToman: b.cash.toFixed(0),
          goldGrams: b.gold.toString(),
          profitLossToman: pl.toFixed(0),
          naghdeFarda: pick(b.byProdName, "نقد فردا"),
          emami86: pick(b.byProdName, "امامی"),
          nimSekkeh: pick(b.byProdName, "نیم سکه"),
          usd: pick(b.byProdName, "دلار"),
          euro: pick(b.byProdName, "یورو"),
          aed: pick(b.byProdName, "درهم"),
        };
      })
      .filter((r) => {
        const plNum = Number(r.profitLossToman);
        if (filterType === "profit") return plNum > 0;
        if (filterType === "loss") return plNum < 0;
        return true;
      });

    return {
      sourceName: "LOCAL_LEDGER_STAGING",
      rows,
    };
  }
}
