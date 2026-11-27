import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
      socket?: { remoteAddress?: string };
    }>();

    const forwarded = req.headers?.["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(",")[0]?.trim();
    const ip = forwardedIp || req.ip || req.socket?.remoteAddress || "unknown";

    const limit = Number(process.env.AUTH_RATE_LIMIT_PER_MIN ?? 100);
    const effectiveLimit = Number.isFinite(limit) && limit > 0 ? limit : 100;

    const count = await this.redis.incrWithTtl(`auth:rl:${ip}`, 60);
    if (count > effectiveLimit) {
      throw new HttpException(
        "تعداد درخواست‌های احراز هویت بیش از حد مجاز است؛ لطفاً کمی صبر کنید",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }
}
