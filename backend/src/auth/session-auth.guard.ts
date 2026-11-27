import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest } from "./auth.types";

export function extractSessionToken(
  headers: Record<string, string | string[] | undefined>
): string | null {
  const authHeader = headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = headers.cookie;
  if (typeof cookieHeader === "string") {
    for (const part of cookieHeader.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === "rs_session") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }
  return null;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractSessionToken(req.headers);
    if (!token) {
      throw new UnauthorizedException("نشست کاربری معتبر یافت نشد");
    }

    const user = await this.authService.getSession(token);
    if (!user) {
      throw new UnauthorizedException("نشست کاربری منقضی یا نامعتبر است");
    }

    req.user = user;
    req.sessionToken = token;
    return true;
  }
}
