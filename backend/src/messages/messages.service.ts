import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationCategory, NotificationColor } from "@prisma/client";
import type { SessionUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

export interface SendMessageInput {
  title?: string;
  body?: string;
  category?: string;
  priorityColor?: string;
  audience?: string; // ALL | ONLINE_ONLY | SELECTED
  recipientIds?: string[];
}

const DEFAULT_ANNOUNCEMENT = {
  id: "default-announcement",
  title: "اعلان و اطلاعیه مهم",
  body: "نقد فردا و مسکوکات روز چهارشنبه، نقد پس‌فردا روز شنبه تسویه می‌شود. مهلت ارسال شماره حساب بانکی حداکثر تا ساعت ۱۰:۰۰ می‌باشد.",
  category: "NORMAL",
  priorityColor: "GOLD",
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway
  ) {}

  private parseCategory(raw?: string): NotificationCategory {
    const val = (raw ?? "NORMAL").trim().toUpperCase();
    if (
      val === "OFFICIAL_CIRCULAR" ||
      val === "SYMBOL_HALT" ||
      val === "VOLATILITY_ALERT"
    ) {
      return val as NotificationCategory;
    }
    return NotificationCategory.NORMAL;
  }

  private parseColor(raw?: string): NotificationColor {
    const val = (raw ?? "GOLD").trim().toUpperCase();
    if (val === "GREEN" || val === "RED") {
      return val as NotificationColor;
    }
    return NotificationColor.GOLD;
  }

  async sendMessage(admin: SessionUser, input: SendMessageInput) {
    const title = input.title?.trim() ?? "";
    const body = input.body?.trim() ?? "";
    if (!title || !body) {
      throw new BadRequestException("عنوان و متن پیام الزامی است");
    }

    const category = this.parseCategory(input.category);
    const priorityColor = this.parseColor(input.priorityColor);
    const audienceRaw = (input.audience ?? "ALL").trim().toUpperCase();
    const audience =
      audienceRaw === "ONLINE_ONLY" || audienceRaw === "SELECTED"
        ? audienceRaw
        : "ALL";

    let recipientUserIds: string[] = [];
    if (audience === "ONLINE_ONLY") {
      recipientUserIds = this.realtime.getOnlineUserIds();
    } else if (audience === "SELECTED") {
      recipientUserIds = Array.isArray(input.recipientIds)
        ? Array.from(new Set(input.recipientIds.filter(Boolean)))
        : [];
    } else {
      const activeUsers = await this.prisma.user.findMany({
        where: { isActive: true, username: { not: "system_treasury" } },
        select: { id: true },
      });
      recipientUserIds = activeUsers.map((u) => u.id);
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.internalMessage.create({
        data: {
          title,
          body,
          category,
          priorityColor,
          audience,
          createdById: admin.id,
          ...(recipientUserIds.length > 0
            ? {
                recipients: {
                  createMany: {
                    data: recipientUserIds.map((userId) => ({ userId })),
                    skipDuplicates: true,
                  },
                },
              }
            : {}),
        },
        include: {
          recipients: { select: { userId: true, isRead: true } },
        },
      });

      await tx.notification.create({
        data: {
          title,
          body,
          category,
          priorityColor,
          onlineOnly: audience === "ONLINE_ONLY",
          audienceLabel:
            audience === "ONLINE_ONLY"
              ? "فقط کاربران آنلاین"
              : audience === "SELECTED"
                ? "کاربران انتخابی"
                : "همه کاربران",
        },
      });

      return created;
    });

    if (recipientUserIds.length > 0) {
      this.realtime.broadcastInternalMessage(recipientUserIds, {
        id: message.id,
        title: message.title,
        body: message.body,
        category: message.category,
        priorityColor: message.priorityColor,
        createdAt: message.createdAt.toISOString(),
      });
    }

    return {
      message,
      recipientCount: recipientUserIds.length,
    };
  }

  async getMyMessages(userId: string) {
    const rows = await this.prisma.internalMessageRecipient.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        message: true,
      },
    });
    return rows.map((r) => ({
      id: r.messageId,
      recipientRowId: r.id,
      title: r.message.title,
      body: r.message.body,
      category: r.message.category,
      priorityColor: r.message.priorityColor,
      audience: r.message.audience,
      isRead: r.isRead,
      readAt: r.readAt,
      createdAt: r.message.createdAt,
    }));
  }

  async markAsRead(userId: string, messageId: string) {
    const rec = await this.prisma.internalMessageRecipient.findFirst({
      where: {
        userId,
        OR: [{ messageId }, { id: messageId }],
      },
    });
    if (!rec) {
      throw new NotFoundException("پیام یافت نشد");
    }
    return this.prisma.internalMessageRecipient.update({
      where: { id: rec.id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getAnnouncement() {
    const latest = await this.prisma.internalMessage.findFirst({
      where: { category: NotificationCategory.NORMAL },
      orderBy: { createdAt: "desc" },
    });
    return {
      announcement: latest ?? DEFAULT_ANNOUNCEMENT,
    };
  }

  async editLastNormalMessage(input: { title?: string; body?: string }) {
    const latest = await this.prisma.internalMessage.findFirst({
      where: { category: NotificationCategory.NORMAL },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) {
      throw new NotFoundException("هیچ پیام عادی برای ویرایش یافت نشد");
    }

    const title = input.title?.trim() || latest.title;
    const body = input.body?.trim() || latest.body;
    const updated = await this.prisma.internalMessage.update({
      where: { id: latest.id },
      data: { title, body },
    });
    return { message: updated };
  }

  async listNotificationsArchive(filters: {
    range?: string;
    from?: string;
    to?: string;
    userId?: string;
    type?: string;
    status?: string;
  }) {
    const now = new Date();
    let gte: Date | undefined;
    let lte: Date | undefined;
    if (filters.from) {
      const d = new Date(filters.from);
      if (!Number.isNaN(d.getTime())) gte = d;
    } else if (filters.range === "today") {
      const tehranDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      gte = new Date(`${tehranDate}T00:00:00.000+03:30`);
    } else if (filters.range === "week") {
      gte = new Date(now.getTime() - 7 * 86_400_000);
    } else if (filters.range === "month") {
      gte = new Date(now.getTime() - 30 * 86_400_000);
    }
    if (filters.to) {
      const d = new Date(filters.to);
      if (!Number.isNaN(d.getTime())) lte = d;
    }
    const createdAtFilter =
      gte || lte
        ? { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) }
        : undefined;

    const catUpper = filters.type?.trim().toUpperCase();
    const validCats = new Set([
      "NORMAL",
      "OFFICIAL_CIRCULAR",
      "SYMBOL_HALT",
      "VOLATILITY_ALERT",
    ]);
    const categoryFilter =
      catUpper && validCats.has(catUpper)
        ? (catUpper as NotificationCategory)
        : undefined;

    const statusNorm = (filters.status ?? "all").trim().toLowerCase();
    let statusWhere: Record<string, unknown> = {};
    if (statusNorm === "approved" || statusNorm === "accepted") {
      statusWhere = { title: { contains: "تایید" } };
    } else if (statusNorm === "rejected") {
      statusWhere = { title: { contains: "رد" } };
    }

    return this.prisma.notification.findMany({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...statusWhere,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, fullName: true, code: true } },
      },
    });
  }
}
