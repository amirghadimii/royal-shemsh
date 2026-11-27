import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  AttachmentsService,
  type UploadedAttachmentFile,
} from "./attachments.service";

@Controller("attachments")
@UseGuards(SessionAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Query("userId") userId?: string
  ) {
    const attachments = await this.attachmentsService.listAttachments(
      req.user!,
      userId
    );
    return { attachments };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "SYSTEM_MANAGER")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 25 * 1024 * 1024 },
    })
  )
  async upload(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: UploadedAttachmentFile | undefined,
    @Body() body: { userId?: string; docType?: string; title?: string }
  ) {
    const attachment = await this.attachmentsService.uploadAttachment(
      req.user!,
      body ?? {},
      file
    );
    return { attachment };
  }
}
