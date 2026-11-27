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
import { type CreateOrderInput, OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(SessionAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: AuthenticatedRequest, @Body() body: CreateOrderInput) {
    return this.ordersService.createOrder(req.user!, body ?? {});
  }

  @Get("mine")
  async mine(@Req() req: AuthenticatedRequest) {
    const orders = await this.ordersService.listMyOrders(req.user!.id);
    return { orders };
  }

  @Get("notifications/mine")
  async myNotifications(@Req() req: AuthenticatedRequest) {
    const notifications = await this.ordersService.listMyNotifications(
      req.user!.id
    );
    return { notifications };
  }

  @Get("pending")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async pending() {
    const orders = await this.ordersService.listPendingOrdersAdmin();
    return { orders };
  }

  @Get("sms-stubs")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async smsStubs(@Query("orderId") orderId?: string) {
    const logs = await this.ordersService.listSmsStubs(orderId);
    return { logs };
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async approve(@Param("id") id: string) {
    return this.ordersService.approveOrder(id);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async reject(
    @Param("id") id: string,
    @Body() body: { reason?: string }
  ) {
    return this.ordersService.rejectOrder(id, body?.reason);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  async cancel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const order = await this.ordersService.cancelOrder(req.user!.id, id);
    return { order };
  }
}
