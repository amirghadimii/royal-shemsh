import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { PriceSourceService } from "../prices/price-source.service";

@Controller()
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("ADMIN", "SYSTEM_MANAGER")
export class ReportsController {
  constructor(private readonly priceSourceService: PriceSourceService) {}

  @Get("commission/report")
  getCommissionReport() {
    return {
      totalCommissionToman: "48625000",
      activeLeaders: 2,
      transactionCount: 28,
    };
  }

  @Get("prices/history")
  async getPricesHistory(
    @Query("productId") productId?: string,
    @Query("productName") productName?: string
  ) {
    return this.priceSourceService.getPriceHistory({ productId, productName });
  }
}
