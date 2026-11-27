import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import type { AuthenticatedRequest } from "./auth.types";
import { extractSessionToken, SessionAuthGuard } from "./session-auth.guard";

@Controller("auth")
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setSessionCookie(res: Response, token: string) {
    res.cookie("rs_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  @Post("otp/request")
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: { mobile?: unknown }) {
    if (typeof body?.mobile !== "string" || !body.mobile.trim()) {
      throw new BadRequestException("شماره موبایل الزامی است");
    }
    return this.authService.requestOtp(body.mobile);
  }

  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: { mobile?: unknown; code?: unknown },
    @Res({ passthrough: true }) res: Response
  ) {
    if (
      typeof body?.mobile !== "string" ||
      !body.mobile.trim() ||
      typeof body?.code !== "string" ||
      !body.code.trim()
    ) {
      throw new BadRequestException("شماره موبایل و کد تایید الزامی هستند");
    }
    const result = await this.authService.verifyOtp(body.mobile, body.code);
    this.setSessionCookie(res, result.token);
    return result;
  }

  @Post("login-password")
  @HttpCode(HttpStatus.OK)
  async loginWithPassword(
    @Body() body: { identifier?: unknown; password?: unknown },
    @Res({ passthrough: true }) res: Response
  ) {
    if (
      typeof body?.identifier !== "string" ||
      !body.identifier.trim() ||
      typeof body?.password !== "string" ||
      !body.password
    ) {
      throw new BadRequestException("نام کاربری و رمز عبور الزامی هستند");
    }
    const result = await this.authService.loginWithPassword(
      body.identifier,
      body.password
    );
    this.setSessionCookie(res, result.token);
    return result;
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  getCurrentUser(@Req() req: AuthenticatedRequest) {
    return { user: req.user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = extractSessionToken(req.headers);
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie("rs_session", { path: "/" });
    return { ok: true };
  }
}
