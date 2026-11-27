import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { PriceSourceService } from "../prices/price-source.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("board")
export class BoardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceSourceService: PriceSourceService
  ) {}

  private async getBoardStatusFlags() {
    const [rows, freshness] = await Promise.all([
      this.prisma.setting.findMany({
        where: {
          key: { in: ["trading_stopped", "working_hours", "portal_notice_text"] },
        },
      }),
      this.priceSourceService.getBoardFreshness(),
    ]);
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      tradingStopped: map.get("trading_stopped") === "true",
      workingHours: map.get("working_hours") ?? "۱۰:۳۰ تا ۲۱:۰۰",
      portalNoticeText: map.get("portal_notice_text") ?? "",
      ...freshness,
    };
  }

  @Get("status")
  async getStatus() {
    return this.getBoardStatusFlags();
  }

  @Get("products")
  @UseGuards(SessionAuthGuard)
  async getAllowedProducts(@Req() req: AuthenticatedRequest) {
    const user = req.user!;
    const roleCode = user.role.code;
    const status = await this.getBoardStatusFlags();

    if (roleCode === "ADMIN" || roleCode === "SYSTEM_MANAGER") {
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      return { products, ...status };
    }

    // Regular users: only products granted through their user_group_members -> user_group_products
    const memberships = await this.prisma.userGroupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true },
    });

    if (memberships.length === 0) {
      return { products: [], ...status };
    }

    const groupIds = memberships.map((m) => m.groupId);
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        groupAccess: {
          some: {
            groupId: { in: groupIds },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return { products, ...status };
  }
}
