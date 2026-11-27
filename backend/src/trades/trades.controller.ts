import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TradesService } from "./trades.service";

@Controller("trades")
@UseGuards(SessionAuthGuard)
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get("mine")
  async mine(
    @Req() req: AuthenticatedRequest,
    @Query("range") range?: string,
    @Query("status") status?: string,
    @Query("audit") audit?: string,
    @Query("search") search?: string,
    @Query("productId") productId?: string
  ) {
    const trades = await this.tradesService.listTrades({
      userId: req.user!.id,
      range,
      status,
      audit,
      search,
      productId,
    });
    return { trades };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async listAll(
    @Query("userId") userId?: string,
    @Query("productId") productId?: string,
    @Query("range") range?: string,
    @Query("status") status?: string,
    @Query("audit") audit?: string,
    @Query("search") search?: string
  ) {
    const trades = await this.tradesService.listTrades({
      userId,
      productId,
      range,
      status,
      audit,
      search,
    });
    return { trades };
  }

  @Patch(":id/audit")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async toggleAudit(
    @Param("id") id: string,
    @Body() body: { audited?: boolean }
  ) {
    const trade = await this.tradesService.toggleAudit(id, body?.audited);
    return { trade };
  }
}
