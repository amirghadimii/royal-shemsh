import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { normalizeDigits } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

export interface CreateUserInput {
  fullName?: string;
  username?: string;
  mobile?: string;
  email?: string | null;
  roleCode?: string;
  password?: string;
  isActive?: boolean;
  groupIds?: string[];
}

export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  mobile?: string;
  email?: string | null;
  roleCode?: string;
  password?: string;
  isActive?: boolean;
}

const USER_SELECT = {
  id: true,
  code: true,
  username: true,
  fullName: true,
  mobile: true,
  email: true,
  isActive: true,
  isOnline: true,
  createdAt: true,
  role: {
    select: { id: true, code: true, name: true, level: true },
  },
  groupMemberships: {
    select: {
      group: {
        select: { id: true, number: true, name: true },
      },
    },
  },
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway
  ) {}

  private formatUser<
    T extends {
      groupMemberships: { group: { id: string; number: number; name: string } }[];
    },
  >(user: T) {
    const { groupMemberships, ...rest } = user;
    return {
      ...rest,
      groups: groupMemberships.map((m) => m.group),
    };
  }

  async listUsers(filters: { search?: string; code?: string; role?: string }) {
    const search = filters.search?.trim();
    const codeRaw = filters.code ? normalizeDigits(filters.code).replace(/\D+/g, "") : "";
    const roleFilter = filters.role?.trim().toUpperCase();

    const users = await this.prisma.user.findMany({
      where: {
        ...(roleFilter && roleFilter !== "ALL"
          ? { role: { code: roleFilter } }
          : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(codeRaw ? { code: Number(codeRaw) } : {}),
      },
      orderBy: { code: "asc" },
      select: USER_SELECT,
    });

    return users.map((u) => this.formatUser(u));
  }

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: { level: "asc" },
      select: { id: true, code: true, name: true, level: true, description: true },
    });
  }

  async listGroups() {
    const groups = await this.prisma.userGroup.findMany({
      where: { isActive: true },
      orderBy: { number: "asc" },
      include: {
        _count: { select: { members: true, products: true } },
      },
    });
    return groups.map((g) => ({
      id: g.id,
      number: g.number,
      name: g.name,
      description: g.description,
      memberCount: g._count.members,
      productCount: g._count.products,
    }));
  }

  async createUser(input: CreateUserInput) {
    const fullName = input.fullName?.trim() ?? "";
    const username = normalizeDigits(input.username ?? "").trim();
    const mobile = normalizeDigits(input.mobile ?? "").replace(/\s+/g, "");
    const email = input.email?.trim() || null;
    const roleCode = (input.roleCode?.trim() || "REGULAR").toUpperCase();
    const password = input.password ?? "";

    if (!fullName || !username || !mobile || !password) {
      throw new BadRequestException(
        "نام کامل، نام کاربری، شماره موبایل و رمز عبور الزامی است"
      );
    }
    if (!/^09\d{9}$/.test(mobile)) {
      throw new BadRequestException("شماره موبایل معتبر نیست (مثال: 09120000000)");
    }
    if (password.length < 6) {
      throw new BadRequestException("رمز عبور باید حداقل ۶ کاراکتر باشد");
    }

    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new BadRequestException("نقش انتخاب‌شده معتبر نیست");
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { mobile }] },
    });
    if (existing) {
      throw new ConflictException("نام کاربری یا شماره موبایل قبلاً ثبت شده است");
    }

    const maxCode = await this.prisma.user.aggregate({ _max: { code: true } });
    const nextCode = (maxCode._max.code ?? 0) + 1;
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await this.prisma.user.create({
      data: {
        code: nextCode,
        username,
        fullName,
        mobile,
        email,
        passwordHash,
        roleId: role.id,
        isActive: input.isActive ?? true,
        ...(input.groupIds && input.groupIds.length > 0
          ? {
              groupMemberships: {
                create: input.groupIds.map((groupId) => ({ groupId })),
              },
            }
          : {}),
      },
      select: USER_SELECT,
    });

    return this.formatUser(created);
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("کاربر یافت نشد");
    }

    const data: Record<string, unknown> = {};
    if (input.fullName !== undefined) {
      const fullName = input.fullName.trim();
      if (!fullName) throw new BadRequestException("نام کامل نمی‌تواند خالی باشد");
      data.fullName = fullName;
    }
    if (input.username !== undefined) {
      const username = normalizeDigits(input.username).trim();
      if (!username) throw new BadRequestException("نام کاربری نمی‌تواند خالی باشد");
      data.username = username;
    }
    if (input.mobile !== undefined) {
      const mobile = normalizeDigits(input.mobile).replace(/\s+/g, "");
      if (!/^09\d{9}$/.test(mobile)) {
        throw new BadRequestException("شماره موبایل معتبر نیست");
      }
      data.mobile = mobile;
    }
    if (input.email !== undefined) {
      data.email = input.email?.trim() || null;
    }
    if (input.isActive !== undefined) {
      data.isActive = Boolean(input.isActive);
    }
    if (input.roleCode !== undefined) {
      const role = await this.prisma.role.findUnique({
        where: { code: input.roleCode.trim().toUpperCase() },
      });
      if (!role) throw new BadRequestException("نقش معتبر نیست");
      data.roleId = role.id;
    }
    if (input.password !== undefined && input.password !== "") {
      if (input.password.length < 6) {
        throw new BadRequestException("رمز عبور باید حداقل ۶ کاراکتر باشد");
      }
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data,
        select: USER_SELECT,
      });
      return this.formatUser(updated);
    } catch {
      throw new ConflictException("نام کاربری یا شماره موبایل تکراری است");
    }
  }

  async setUserStatus(id: string, isActive: boolean) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("کاربر یافت نشد");
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: USER_SELECT,
    });
    return this.formatUser(updated);
  }

  async replaceUserGroups(id: string, groupIds: string[]) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("کاربر یافت نشد");

    await this.prisma.$transaction(async (tx) => {
      await tx.userGroupMember.deleteMany({ where: { userId: id } });
      if (groupIds.length > 0) {
        await tx.userGroupMember.createMany({
          data: groupIds.map((groupId) => ({ userId: id, groupId })),
          skipDuplicates: true,
        });
      }
    });

    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: USER_SELECT,
    });
    return this.formatUser(updated);
  }

  async addUserGroup(id: string, groupId: string) {
    const [user, group] = await Promise.all([
      this.prisma.user.findUnique({ where: { id } }),
      this.prisma.userGroup.findUnique({ where: { id: groupId } }),
    ]);
    if (!user) throw new NotFoundException("کاربر یافت نشد");
    if (!group) throw new NotFoundException("گروه یافت نشد");

    await this.prisma.userGroupMember.upsert({
      where: { userId_groupId: { userId: id, groupId } },
      update: {},
      create: { userId: id, groupId },
    });

    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: USER_SELECT,
    });
    return this.formatUser(updated);
  }

  async removeUserGroup(id: string, groupId: string) {
    await this.prisma.userGroupMember.deleteMany({
      where: { userId: id, groupId },
    });
    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: USER_SELECT,
    });
    return this.formatUser(updated);
  }

  async getSettings() {
    const settings = await this.prisma.setting.findMany({
      orderBy: { key: "asc" },
    });
    const map = new Map(settings.map((s) => [s.key, s.value]));
    return {
      settings,
      config: {
        responseTimeoutSeconds: Number(
          map.get("response_timeout_seconds") ?? "60"
        ),
        homeGoldMode: map.get("home_gold_mode") ?? "1",
        workingHours: map.get("working_hours") ?? "۱۰:۳۰ تا ۲۱:۰۰",
        portalNoticeText: map.get("portal_notice_text") ?? "",
        tradingStopped: map.get("trading_stopped") === "true",
        priceStaleThresholdSeconds: Number(
          map.get("price_stale_threshold_seconds") ?? "120"
        ),
        enforceWorkingHours: map.get("enforce_working_hours") === "true",
        shadowMode: map.has("shadow_mode")
          ? map.get("shadow_mode") === "true"
          : process.env.SHADOW_MODE === "true",
      },
    };
  }

  async updateSettings(input: {
    responseTimeoutSeconds?: number;
    homeGoldMode?: string;
    workingHours?: string;
    portalNoticeText?: string;
    tradingStopped?: boolean;
    priceStaleThresholdSeconds?: number;
    enforceWorkingHours?: boolean;
    shadowMode?: boolean;
  }) {
    const ops: { key: string; value: string; description: string }[] = [];

    if (input.responseTimeoutSeconds !== undefined) {
      const sec = Number(input.responseTimeoutSeconds);
      if (!Number.isFinite(sec) || sec < 5 || sec > 600) {
        throw new BadRequestException(
          "مدت زمان پاسخ باید بین ۵ تا ۶۰۰ ثانیه باشد"
        );
      }
      ops.push({
        key: "response_timeout_seconds",
        value: String(Math.round(sec)),
        description: "مدت زمان پاسخ (ثانیه)",
      });
    }

    if (input.homeGoldMode !== undefined) {
      const mode = String(input.homeGoldMode).trim();
      if (!["1", "2", "3"].includes(mode)) {
        throw new BadRequestException("نحوه ارتباط با هوم گلد معتبر نیست");
      }
      ops.push({
        key: "home_gold_mode",
        value: mode,
        description: "نحوه ارتباط با هوم گلد",
      });
    }

    if (input.workingHours !== undefined) {
      const hours = String(input.workingHours).trim();
      if (!hours) {
        throw new BadRequestException("ساعت کاری نمی‌تواند خالی باشد");
      }
      ops.push({
        key: "working_hours",
        value: hours,
        description: "ساعت کاری بازار",
      });
    }

    if (input.portalNoticeText !== undefined) {
      ops.push({
        key: "portal_notice_text",
        value: String(input.portalNoticeText),
        description: "متن اطلاعیه تابلو اعلان زنده",
      });
    }

    if (input.tradingStopped !== undefined) {
      ops.push({
        key: "trading_stopped",
        value: input.tradingStopped ? "true" : "false",
        description: "توقف معاملات توسط مدیر",
      });
    }

    if (input.priceStaleThresholdSeconds !== undefined) {
      const sec = Number(input.priceStaleThresholdSeconds);
      if (!Number.isFinite(sec) || sec < 1 || sec > 86400) {
        throw new BadRequestException("آستانه انقضای قیمت نامعتبر است");
      }
      ops.push({
        key: "price_stale_threshold_seconds",
        value: String(Math.round(sec)),
        description: "آستانه انقضای به‌روزرسانی قیمت (ثانیه)",
      });
    }

    if (input.enforceWorkingHours !== undefined) {
      ops.push({
        key: "enforce_working_hours",
        value: input.enforceWorkingHours ? "true" : "false",
        description: "اعمال محدودیت ساعت کاری بازار",
      });
    }

    if (input.shadowMode !== undefined) {
      ops.push({
        key: "shadow_mode",
        value: input.shadowMode ? "true" : "false",
        description: "حالت سایه (بدون ثبت معامله و سند حسابداری)",
      });
    }

    if (ops.length > 0) {
      await this.prisma.$transaction(
        ops.map((op) =>
          this.prisma.setting.upsert({
            where: { key: op.key },
            update: { value: op.value },
            create: op,
          })
        )
      );
    }

    const updated = await this.getSettings();
    this.realtime.broadcastBoardStatus({
      tradingStopped: updated.config.tradingStopped,
      workingHours: updated.config.workingHours,
      portalNoticeText: updated.config.portalNoticeText,
    });
    return updated;
  }

  async updateSmsRule(
    id: string,
    input: { title?: string; templateText?: string; isActive?: boolean }
  ) {
    const existing = await this.prisma.smsRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("قانون پیامک یافت نشد");

    return this.prisma.smsRule.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.templateText !== undefined
          ? { templateText: input.templateText.trim() }
          : {}),
        ...(input.isActive !== undefined
          ? { isActive: Boolean(input.isActive) }
          : {}),
      },
    });
  }

  async sendManualSmsRule(id: string) {
    const rule = await this.prisma.smsRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException("قانون پیامک یافت نشد");
    if (rule.triggerType !== "MANUAL") {
      throw new BadRequestException("فقط قوانین ارسال دستی قابل اجرا هستند");
    }

    const activeUsers = await this.prisma.user.findMany({
      where: { isActive: true, username: { not: "system_treasury" } },
      select: { id: true, mobile: true },
    });

    if (activeUsers.length === 0) {
      return { count: 0, logs: [] };
    }

    const logs = await this.prisma.$transaction(
      activeUsers.map((u) =>
        this.prisma.smsLog.create({
          data: {
            userId: u.id,
            ruleCode: rule.code,
            ruleTitle: rule.title,
            mobile: u.mobile,
            body: rule.templateText,
            status: "STUB",
          },
        })
      )
    );

    return { count: logs.length, logs };
  }

  async getShadowLogs(limit = 50) {
    const logs = await this.prisma.shadowLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { logs };
  }
}
