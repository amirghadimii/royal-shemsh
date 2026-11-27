import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  type CreateRemittanceInput,
  RemittancesService,
} from "./remittances.service";

@Controller()
@UseGuards(SessionAuthGuard)
export class RemittancesController {
  constructor(private readonly remittancesService: RemittancesService) {}

  @Post("admin/remittances")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async create(@Body() body: CreateRemittanceInput) {
    const remittance = await this.remittancesService.createRemittance(body ?? {});
    return { remittance };
  }

  @Get("admin/remittances")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async listAdmin(
    @Query("userId") userId?: string,
    @Query("type") type?: string
  ) {
    const remittances = await this.remittancesService.listRemittances({
      userId,
      type,
    });
    return { remittances };
  }

  @Get("remittances/mine")
  async listMine(@Req() req: AuthenticatedRequest) {
    const remittances = await this.remittancesService.listRemittances({
      userId: req.user!.id,
    });
    return { remittances };
  }
}
