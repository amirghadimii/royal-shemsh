import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "node:crypto";
import { loadEnvConfig } from "../config/env.config";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import type { SessionUser } from "./auth.types";

const MAX_FAILED_ATTEMPTS = 5;
const FAIL_WINDOW_SECONDS = 300;
const LOCKOUT_SECONDS = 180;
const SESSION_TTL_SECONDS = 86_400;

export function normalizeDigits(raw: string): string {
  return raw
    .trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config = loadEnvConfig();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  private get otpTtlSeconds(): number {
    const raw = Number(process.env.OTP_TTL_SECONDS ?? 120);
    return Number.isFinite(raw) && raw > 0 ? raw : 120;
  }

  private async ensureNotLocked(lockKey: string): Promise<void> {
    const locked = await this.redis.get(`auth:lock:${lockKey}`);
    if (locked) {
      const remaining = await this.redis.ttl(`auth:lock:${lockKey}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.",
          retryAfterSeconds: remaining > 0 ? remaining : LOCKOUT_SECONDS,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  private async recordFailedAttempt(lockKey: string): Promise<void> {
    const count = await this.redis.incrWithTtl(
      `auth:fail:${lockKey}`,
      FAIL_WINDOW_SECONDS
    );
    if (count >= MAX_FAILED_ATTEMPTS) {
      await this.redis.set(`auth:lock:${lockKey}`, "1", LOCKOUT_SECONDS);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: "حساب موقتاً به دلیل تلاش‌های ناموفق قفل شد.",
          retryAfterSeconds: LOCKOUT_SECONDS,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  private async createSession(user: {
    id: string;
    code: number;
    username: string;
    fullName: string;
    mobile: string;
    email: string | null;
    role: { id: string; code: string; name: string; level: number };
  }): Promise<{ token: string; user: SessionUser }> {
    const token = crypto.randomBytes(32).toString("hex");
    const sessionUser: SessionUser = {
      id: user.id,
      code: user.code,
      username: user.username,
      fullName: user.fullName,
      mobile: user.mobile,
      email: user.email,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
        level: user.role.level,
      },
    };

    await this.redis.set(
      `auth:session:${token}`,
      JSON.stringify(sessionUser),
      SESSION_TTL_SECONDS
    );

    return { token, user: sessionUser };
  }

  async requestOtp(rawMobile: string) {
    const mobile = normalizeDigits(rawMobile).replace(/\s+/g, "");
    if (!/^09\d{9}$/.test(mobile)) {
      throw new UnauthorizedException("شماره موبایل معتبر نیست");
    }

    await this.ensureNotLocked(mobile);

    const user = await this.prisma.user.findUnique({
      where: { mobile },
      include: { role: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("کاربری با این شماره موبایل یافت نشد");
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const ttl = this.otpTtlSeconds;
    await this.redis.set(`auth:otp:${mobile}`, code, ttl);

    // Staging/development only — NEVER log OTP codes in production
    if (this.config.env !== "production" && process.env.NODE_ENV !== "production") {
      this.logger.log(`[STAGING OTP] mobile=${mobile} code=${code} ttl=${ttl}s`);
    }

    return {
      ok: true,
      expiresInSeconds: ttl,
      message: "کد احراز هویت ارسال شد",
    };
  }

  async verifyOtp(rawMobile: string, rawCode: string) {
    const mobile = normalizeDigits(rawMobile).replace(/\s+/g, "");
    const code = normalizeDigits(rawCode).replace(/\s+/g, "");

    await this.ensureNotLocked(mobile);

    const expected = await this.redis.get(`auth:otp:${mobile}`);
    if (!expected || expected.length !== code.length) {
      await this.recordFailedAttempt(mobile);
      throw new UnauthorizedException("کد تایید منقضی شده یا نامعتبر است");
    }

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(code, "utf8")
    );
    if (!isMatch) {
      await this.recordFailedAttempt(mobile);
      throw new UnauthorizedException("کد تایید نادرست است");
    }

    const user = await this.prisma.user.findUnique({
      where: { mobile },
      include: { role: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("حساب کاربری غیرفعال است");
    }

    await this.redis.del(`auth:otp:${mobile}`);
    await this.redis.del(`auth:fail:${mobile}`);

    return this.createSession(user);
  }

  async loginWithPassword(rawIdentifier: string, password: string) {
    const identifier = normalizeDigits(rawIdentifier).replace(/\s+/g, "");
    if (!identifier || !password) {
      throw new UnauthorizedException("نام کاربری و رمز عبور الزامی است");
    }

    await this.ensureNotLocked(identifier);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ mobile: identifier }, { username: identifier }],
      },
      include: { role: true },
    });

    if (!user || !user.isActive || !user.passwordHash) {
      await this.recordFailedAttempt(identifier);
      throw new UnauthorizedException("نام کاربری یا رمز عبور نادرست است");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.recordFailedAttempt(identifier);
      throw new UnauthorizedException("نام کاربری یا رمز عبور نادرست است");
    }

    await this.redis.del(`auth:fail:${identifier}`);
    return this.createSession(user);
  }

  async getSession(token: string): Promise<SessionUser | null> {
    if (!token) return null;
    const raw = await this.redis.get(`auth:session:${token}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    if (token) {
      await this.redis.del(`auth:session:${token}`);
    }
  }
}
