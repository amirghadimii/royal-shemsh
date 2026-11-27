import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminService,
  type CreateUserInput,
  type UpdateUserInput,
} from "./admin.service";

@Controller("admin")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("ADMIN", "SYSTEM_MANAGER")
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService
  ) {}

  @Get("users")
  async getUsers(
    @Query("search") search?: string,
    @Query("code") code?: string,
    @Query("role") role?: string
  ) {
    const users = await this.adminService.listUsers({ search, code, role });
    return { users };
  }

  @Get("roles")
  async getRoles() {
    const roles = await this.adminService.listRoles();
    return { roles };
  }

  @Get("groups")
  async getGroups() {
    const groups = await this.adminService.listGroups();
    return { groups };
  }

  @Post("users")
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: CreateUserInput) {
    const user = await this.adminService.createUser(body ?? {});
    return { user };
  }

  @Patch("users/:id")
  async updateUser(@Param("id") id: string, @Body() body: UpdateUserInput) {
    const user = await this.adminService.updateUser(id, body ?? {});
    return { user };
  }

  @Patch("users/:id/status")
  async setUserStatus(
    @Param("id") id: string,
    @Body() body: { isActive?: boolean }
  ) {
    const user = await this.adminService.setUserStatus(
      id,
      Boolean(body?.isActive)
    );
    return { user };
  }

  @Put("users/:id/groups")
  async replaceUserGroups(
    @Param("id") id: string,
    @Body() body: { groupIds?: string[] }
  ) {
    const user = await this.adminService.replaceUserGroups(
      id,
      Array.isArray(body?.groupIds) ? body.groupIds : []
    );
    return { user };
  }

  @Post("users/:id/groups")
  @HttpCode(HttpStatus.OK)
  async addUserGroup(
    @Param("id") id: string,
    @Body() body: { groupId?: string }
  ) {
    const user = await this.adminService.addUserGroup(id, body?.groupId ?? "");
    return { user };
  }

  @Delete("users/:id/groups/:groupId")
  async removeUserGroup(
    @Param("id") id: string,
    @Param("groupId") groupId: string
  ) {
    const user = await this.adminService.removeUserGroup(id, groupId);
    return { user };
  }

  @Get("settings")
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put("settings")
  async putSettings(
    @Body()
    body: {
      responseTimeoutSeconds?: number;
      homeGoldMode?: string;
      workingHours?: string;
      portalNoticeText?: string;
      tradingStopped?: boolean;
      priceStaleThresholdSeconds?: number;
      enforceWorkingHours?: boolean;
    }
  ) {
    return this.adminService.updateSettings(body ?? {});
  }

  @Patch("settings")
  async patchSettings(
    @Body()
    body: {
      responseTimeoutSeconds?: number;
      homeGoldMode?: string;
      workingHours?: string;
      portalNoticeText?: string;
      tradingStopped?: boolean;
      priceStaleThresholdSeconds?: number;
      enforceWorkingHours?: boolean;
    }
  ) {
    return this.adminService.updateSettings(body ?? {});
  }

  @Get("sms-rules")
  async getSmsRules() {
    const rules = await this.prisma.smsRule.findMany({
      orderBy: { code: "asc" },
    });
    return { rules };
  }

  @Patch("sms-rules/:id")
  async updateSmsRule(
    @Param("id") id: string,
    @Body()
    body: { title?: string; templateText?: string; isActive?: boolean }
  ) {
    const rule = await this.adminService.updateSmsRule(id, body ?? {});
    return { rule };
  }

  @Post("sms-rules/:id/send-manual")
  @HttpCode(HttpStatus.OK)
  async sendManualSmsRule(@Param("id") id: string) {
    return this.adminService.sendManualSmsRule(id);
  }

  @Get("shadow-logs")
  async getShadowLogs() {
    return this.adminService.getShadowLogs();
  }
}
