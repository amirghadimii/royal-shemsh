import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { PriceSourceService } from "./price-source.service";

@Controller("admin/prices")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("ADMIN", "SYSTEM_MANAGER")
export class PricesController {
  constructor(private readonly priceSourceService: PriceSourceService) {}

  @Post("manual")
  @HttpCode(HttpStatus.OK)
  async setManualPrice(
    @Body()
    body: {
      productId?: string;
      buyPrice?: string | number;
      sellPrice?: string | number;
    }
  ) {
    return this.priceSourceService.setManualPrice(body ?? {});
  }

  @Post("homegold-stub/tick")
  @HttpCode(HttpStatus.OK)
  async injectStubTick(
    @Body()
    body: {
      productId?: string;
      buyPrice?: string | number;
      sellPrice?: string | number;
    }
  ) {
    return this.priceSourceService.ingestStubTick({
      productId: body?.productId ?? "",
      buyPrice: body?.buyPrice ?? "",
      sellPrice: body?.sellPrice ?? "",
    });
  }

  @Get("outbox")
  async listOutbox(@Query("productId") productId?: string) {
    const outbox = await this.priceSourceService.listOutbox(productId);
    return { outbox };
  }
}
