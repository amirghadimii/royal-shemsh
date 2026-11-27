import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { AccountingService } from "./accounting.service";

@Controller()
@UseGuards(SessionAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get("accounting/mine")
  async getMine(
    @Req() req: AuthenticatedRequest,
    @Query("range") range?: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.accountingService.getMyAccounting(req.user!.id, {
      range,
      from,
      to,
    });
  }

  @Get("accounting/mine/export")
  async exportMine(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ) {
    const csv = await this.accountingService.buildCsvExport(req.user!.id);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ledger-mine.csv"'
    );
    res.send(csv);
  }

  @Get("admin/accounting")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async getAdminAccounting(
    @Query("search") search?: string,
    @Query("filter") filter?: string
  ) {
    return this.accountingService.getAdminAccounting({ search, filter });
  }

  @Get("admin/accounting/export")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async exportAdmin(@Res() res: Response) {
    const csv = await this.accountingService.buildCsvExport();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ledger-all.csv"'
    );
    res.send(csv);
  }
}
