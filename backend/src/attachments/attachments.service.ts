import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttachmentDocType, AttachmentStatus } from "@prisma/client";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { SessionUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const DOC_TYPE_MAP: Record<string, AttachmentDocType> = {
  NATIONAL_ID: AttachmentDocType.NATIONAL_ID,
  "کارت ملی": AttachmentDocType.NATIONAL_ID,
  BUSINESS_LICENSE: AttachmentDocType.BUSINESS_LICENSE,
  "جواز کسب": AttachmentDocType.BUSINESS_LICENSE,
  BROKERAGE_CONTRACT: AttachmentDocType.BROKERAGE_CONTRACT,
  "قرارداد کارگزاری": AttachmentDocType.BROKERAGE_CONTRACT,
  BANK_CONFIRMATION: AttachmentDocType.BANK_CONFIRMATION,
  "تاییدیه حساب بانکی": AttachmentDocType.BANK_CONFIRMATION,
};

const DOC_TYPE_LABELS: Record<AttachmentDocType, string> = {
  NATIONAL_ID: "کارت ملی",
  BUSINESS_LICENSE: "جواز کسب",
  BROKERAGE_CONTRACT: "قرارداد کارگزاری",
  BANK_CONFIRMATION: "تاییدیه حساب بانکی",
};

export interface UploadedAttachmentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class AttachmentsService {
  private readonly uploadDir = path.resolve(
    process.cwd(),
    "uploads",
    "staging"
  );

  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user: SessionUser): boolean {
    return user.role.code === "ADMIN" || user.role.code === "SYSTEM_MANAGER";
  }

  async listAttachments(currentUser: SessionUser, requestedUserId?: string) {
    const admin = this.isAdmin(currentUser);
    let targetUserId = requestedUserId?.trim() || currentUser.id;

    if (!admin && targetUserId !== currentUser.id) {
      throw new ForbiddenException("شما به این سرویس دسترسی ندارید");
    }

    if (admin && !requestedUserId?.trim()) {
      const items = await this.prisma.attachment.findMany({
        orderBy: { uploadedAt: "desc" },
        include: {
          user: { select: { id: true, code: true, fullName: true, username: true } },
          uploadedBy: { select: { id: true, fullName: true, username: true } },
        },
      });
      return items.map((a) => ({
        ...a,
        docTypeLabel: DOC_TYPE_LABELS[a.docType],
      }));
    }

    const items = await this.prisma.attachment.findMany({
      where: { userId: targetUserId },
      orderBy: { uploadedAt: "desc" },
      include: {
        user: { select: { id: true, code: true, fullName: true, username: true } },
        uploadedBy: { select: { id: true, fullName: true, username: true } },
      },
    });

    return items.map((a) => ({
      ...a,
      docTypeLabel: DOC_TYPE_LABELS[a.docType],
    }));
  }

  async uploadAttachment(
    uploader: SessionUser,
    input: { userId?: string; docType?: string; title?: string },
    file?: UploadedAttachmentFile
  ) {
    if (!file) {
      throw new BadRequestException("فایل مدرک ارسال نشده است");
    }

    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
      throw new BadRequestException(
        "فرمت فایل مجاز نیست. فقط PDF، JPG و PNG پشتیبانی می‌شود"
      );
    }

    if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException("حداکثر حجم مجاز فایل ۱۰ مگابایت است");
    }

    const userId = input.userId?.trim() || "";
    if (!userId) {
      throw new BadRequestException("شناسه کاربر الزامی است");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException("کاربر مورد نظر یافت نشد");
    }

    const docType = DOC_TYPE_MAP[input.docType?.trim() ?? ""];
    if (!docType) {
      throw new BadRequestException(
        "نوع مدرک معتبر نیست (کارت ملی / جواز کسب / قرارداد کارگزاری / تاییدیه حساب بانکی)"
      );
    }

    await fs.mkdir(this.uploadDir, { recursive: true });
    const storedName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const targetPath = path.join(this.uploadDir, storedName);
    await fs.writeFile(targetPath, file.buffer);

    const title = input.title?.trim() || DOC_TYPE_LABELS[docType];

    const created = await this.prisma.attachment.create({
      data: {
        userId,
        uploadedById: uploader.id,
        docType,
        title,
        fileName: file.originalname,
        storedName,
        mimeType: mime,
        sizeBytes: file.size,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, code: true, fullName: true, username: true } },
        uploadedBy: { select: { id: true, fullName: true, username: true } },
      },
    });

    return {
      ...created,
      docTypeLabel: DOC_TYPE_LABELS[created.docType],
    };
  }

  async updateAttachmentStatus(id: string, statusRaw: string) {
    const normalized = String(statusRaw ?? "").trim().toUpperCase();
    if (
      normalized !== AttachmentStatus.APPROVED &&
      normalized !== AttachmentStatus.REJECTED &&
      normalized !== AttachmentStatus.PENDING
    ) {
      throw new BadRequestException("وضعیت مدرک معتبر نیست");
    }
    const existing = await this.prisma.attachment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("مدرک یافت نشد");
    }
    const updated = await this.prisma.attachment.update({
      where: { id },
      data: { status: normalized as AttachmentStatus },
      include: {
        user: { select: { id: true, code: true, fullName: true, username: true } },
        uploadedBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    return {
      ...updated,
      docTypeLabel: DOC_TYPE_LABELS[updated.docType],
    };
  }
}
