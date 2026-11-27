import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  HomeGoldAdapter,
  HomeGoldTickInput,
  NormalizedHomeGoldTick,
} from "./homegold-adapter.interface";

/**
 * Staging-only stub adapter for HomeGold ticks.
 * Never connects to homegold750.ir or any external trading system.
 */
@Injectable()
export class StagingHomeGoldStubAdapter implements HomeGoldAdapter {
  readonly name = "STAGING_HOMEGOLD_STUB";

  buildSampleTick(input: HomeGoldTickInput): NormalizedHomeGoldTick {
    const productId = input.productId?.trim();
    if (!productId) {
      throw new BadRequestException("شناسه کالا الزامی است");
    }

    let buy: Prisma.Decimal;
    let sell: Prisma.Decimal;
    try {
      buy = new Prisma.Decimal(String(input.buyPrice ?? "").trim());
      sell = new Prisma.Decimal(String(input.sellPrice ?? "").trim());
    } catch {
      throw new BadRequestException("قیمت خرید و فروش معتبر نیست");
    }

    if (!buy.isFinite() || buy.lte(0) || !sell.isFinite() || sell.lte(0)) {
      throw new BadRequestException("قیمت خرید و فروش باید بزرگ‌تر از صفر باشد");
    }

    return {
      productId,
      buyPrice: buy.toFixed(0),
      sellPrice: sell.toFixed(0),
      receivedAt: new Date(),
      adapterName: this.name,
    };
  }
}
