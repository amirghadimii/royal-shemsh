import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { MessagesService, type SendMessageInput } from "./messages.service";

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get("messages/announcement")
  getAnnouncement() {
    return this.messagesService.getAnnouncement();
  }

  @Get("messages/mine")
  @UseGuards(SessionAuthGuard)
  async getMyMessages(@Req() req: AuthenticatedRequest) {
    const messages = await this.messagesService.getMyMessages(req.user!.id);
    return { messages };
  }

  @Post("messages/:id/read")
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async markRead(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string
  ) {
    const recipient = await this.messagesService.markAsRead(req.user!.id, id);
    return { recipient };
  }

  @Post("admin/messages")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  sendMessage(
    @Req() req: AuthenticatedRequest,
    @Body() body: SendMessageInput
  ) {
    return this.messagesService.sendMessage(req.user!, body ?? {});
  }

  @Patch("admin/messages/last-normal")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  editLastNormal(@Body() body: { title?: string; body?: string }) {
    return this.messagesService.editLastNormalMessage(body ?? {});
  }

  @Get("admin/notifications")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  async listNotifications(
    @Query("range") range?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("userId") userId?: string,
    @Query("type") type?: string,
    @Query("status") status?: string
  ) {
    const notifications = await this.messagesService.listNotificationsArchive({
      range,
      from,
      to,
      userId,
      type,
      status,
    });
    return { notifications };
  }
}
