import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  type CreateManualPreOrderInput,
  type CreatePreOrderInput,
  PreOrdersService,
} from "./preorders.service";

@Controller("preorders")
@UseGuards(SessionAuthGuard)
export class PreOrdersController {
  constructor(private readonly preOrdersService: PreOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreatePreOrderInput
  ) {
    return this.preOrdersService.createUserPreOrder(req.user!, body ?? {});
  }

  @Post("manual")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async createManual(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateManualPreOrderInput
  ) {
    return this.preOrdersService.createManualPreOrder(req.user!, body ?? {});
  }

  @Get("mine")
  async mine(
    @Req() req: AuthenticatedRequest,
    @Query("range") range?: string,
    @Query("status") status?: string,
    @Query("search") search?: string
  ) {
    const preOrders = await this.preOrdersService.listMyPreOrders(
      req.user!.id,
      { range, status, search }
    );
    return { preOrders };
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  async cancel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const preOrder = await this.preOrdersService.cancelPreOrder(
      req.user!.id,
      id
    );
    return { preOrder };
  }
}
