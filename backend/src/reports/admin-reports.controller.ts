import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { AdminReportsService } from "./admin-reports.service";

@Controller("admin/reports")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("ADMIN", "SYSTEM_MANAGER")
export class AdminReportsController {
  constructor(private readonly adminReports: AdminReportsService) {}

  @Get("profit-loss")
  getProfitLoss(@Query("days") days?: string) {
    return this.adminReports.getProfitLoss(days);
  }

  @Get("asset-dashboard")
  getAssetDashboard() {
    return this.adminReports.getAssetDashboard();
  }

  @Get("customer-pl")
  getCustomerPl(
    @Query("search") search?: string,
    @Query("filter") filter?: string
  ) {
    return this.adminReports.getCustomerPl({ search, filter });
  }

  @Get("commission")
  getCommission(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("userId") userId?: string
  ) {
    return this.adminReports.getCommissionReport({ from, to, userId });
  }

  @Get("discrepancy")
  getDiscrepancy(
    @Query("range") range?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("userId") userId?: string,
    @Query("productId") productId?: string
  ) {
    return this.adminReports.getDiscrepancyReport({
      range,
      from,
      to,
      userId,
      productId,
    });
  }

  @Get("order-balance")
  getOrderBalance(@Query("date") date?: string) {
    return this.adminReports.getOrderBalance(date);
  }
}
