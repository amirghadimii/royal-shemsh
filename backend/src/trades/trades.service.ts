import { Injectable, NotFoundException } from "@nestjs/common";
import { TradeStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface TradesFilterInput {
  userId?: string;
  productId?: string;
  range?: string;
  status?: string;
  audit?: string;
  search?: string;
}

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTrades(filters: TradesFilterInput) {
    const now = new Date();
    let since: Date | undefined;
    if (filters.range === "today") {
      const tehranDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      since = new Date(`${tehranDate}T00:00:00.000+03:30`);
    } else if (filters.range === "week") {
      since = new Date(now.getTime() - 7 * 86_400_000);
    } else if (filters.range === "month") {
      since = new Date(now.getTime() - 30 * 86_400_000);
    }

    const statusUpper = filters.status?.trim().toUpperCase();
    const validStatuses = new Set(["APPROVED", "REJECTED", "PENDING", "NO_RESPONSE"]);
    const statusFilter =
      statusUpper && validStatuses.has(statusUpper)
        ? (statusUpper as TradeStatus)
        : undefined;

    const auditNorm = filters.audit?.trim().toLowerCase();
    const auditedFilter =
      auditNorm === "audited"
        ? true
        : auditNorm === "unaudited"
          ? false
          : undefined;

    const search = filters.search?.trim();

    return this.prisma.trade.findMany({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(since ? { createdAt: { gte: since } } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(auditedFilter !== undefined ? { audited: auditedFilter } : {}),
        ...(search
          ? {
              OR: [
                { tradeCode: { contains: search, mode: "insensitive" } },
                { product: { name: { contains: search, mode: "insensitive" } } },
                { user: { fullName: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, code: true, fullName: true, username: true } },
        product: { select: { id: true, name: true, unit: true, badge: true } },
      },
    });
  }

  async toggleAudit(tradeId: string, explicitAudited?: boolean) {
    const existing = await this.prisma.trade.findUnique({
      where: { id: tradeId },
    });
    if (!existing) {
      throw new NotFoundException("معامله یافت نشد");
    }
    return this.prisma.trade.update({
      where: { id: tradeId },
      data: {
        audited:
          explicitAudited !== undefined ? explicitAudited : !existing.audited,
      },
      include: {
        user: { select: { id: true, code: true, fullName: true, username: true } },
        product: { select: { id: true, name: true, unit: true, badge: true } },
      },
    });
  }
}
