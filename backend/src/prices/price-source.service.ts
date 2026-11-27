import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PreOrdersService } from "../preorders/preorders.service";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import {
  HOMEGOLD_ADAPTER,
  type HomeGoldAdapter,
  type HomeGoldTickInput,
} from "./homegold-adapter.interface";

@Injectable()
export class PriceSourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preOrders: PreOrdersService,
    private readonly realtime: RealtimeGateway,
    @Inject(HOMEGOLD_ADAPTER) private readonly adapter: HomeGoldAdapter
  ) {}

  private parsePrice(raw: string | number | undefined, label: string): Prisma.Decimal {
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      throw new BadRequestException(`${label} الزامی است`);
    }
    try {
      const dec = new Prisma.Decimal(String(raw).trim());
      if (!dec.isFinite() || dec.lte(0)) {
        throw new BadRequestException(`${label} باید بزرگ‌تر از صفر باشد`);
      }
      return dec;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`${label} معتبر نیست`);
    }
  }

  private async getCurrentHomeGoldMode(): Promise<"1" | "2" | "3"> {
    const row = await this.prisma.setting.findUnique({
      where: { key: "home_gold_mode" },
    });
    const val = row?.value?.trim();
    if (val === "2" || val === "3") return val;
    return "1";
  }

  async setManualPrice(input: {
    productId?: string;
    buyPrice?: string | number;
    sellPrice?: string | number;
  }) {
    const productId = input.productId?.trim();
    if (!productId) {
      throw new BadRequestException("شناسه کالا الزامی است");
    }
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      throw new NotFoundException("کالا یافت نشد");
    }

    const buyPrice = this.parsePrice(input.buyPrice, "قیمت خرید");
    const sellPrice = this.parsePrice(input.sellPrice, "قیمت فروش");

    const res = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: { buyPrice, sellPrice },
      });
      const tick = await tx.priceTick.create({
        data: {
          productId,
          buyPrice,
          sellPrice,
          source: "ADMIN_MANUAL",
        },
      });
      return { product, tick };
    });

    await this.realtime.broadcastPriceUpdate({
      productId: res.product.id,
      name: res.product.name,
      badge: res.product.badge,
      subtitle: res.product.subtitle,
      buyPrice: res.product.buyPrice.toFixed(0),
      sellPrice: res.product.sellPrice.toFixed(0),
      source: res.tick.source,
      recordedAt: res.tick.recordedAt.toISOString(),
    });

    await this.preOrders.evaluateTriggersForProduct(res.product.id);

    return res;
  }

  async ingestStubTick(input: HomeGoldTickInput) {
    const tickData = this.adapter.buildSampleTick(input);
    const existing = await this.prisma.product.findUnique({
      where: { id: tickData.productId },
    });
    if (!existing) {
      throw new NotFoundException("کالا یافت نشد");
    }

    const mode = await this.getCurrentHomeGoldMode();

    // Mode 1: manual pricing only -> adapter ticks are ignored
    if (mode === "1") {
      return {
        applied: false,
        mode,
        adapter: tickData.adapterName,
        message: "در حالت ۱ (قیمت‌دهی دستی ادمین)، تیک هوم گلد نادیده گرفته شد.",
      };
    }

    const buyPrice = new Prisma.Decimal(tickData.buyPrice);
    const sellPrice = new Prisma.Decimal(tickData.sellPrice);

    // Mode 2 & Mode 3: update board product price and record in price_ticks
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: tickData.productId },
        data: { buyPrice, sellPrice },
      });

      const tick = await tx.priceTick.create({
        data: {
          productId: tickData.productId,
          buyPrice,
          sellPrice,
          source: "HOMEGOLD_STUB",
        },
      });

      let outbox = null;
      if (mode === "3") {
        outbox = await tx.homeGoldOutbox.create({
          data: {
            productId: tickData.productId,
            buyPrice,
            sellPrice,
            mode: "3",
            status: "QUEUED_STUB",
          },
        });
      }

      return { product, tick, outbox };
    });

    await this.realtime.broadcastPriceUpdate({
      productId: result.product.id,
      name: result.product.name,
      badge: result.product.badge,
      subtitle: result.product.subtitle,
      buyPrice: result.product.buyPrice.toFixed(0),
      sellPrice: result.product.sellPrice.toFixed(0),
      source: result.tick.source,
      recordedAt: result.tick.recordedAt.toISOString(),
    });

    await this.preOrders.evaluateTriggersForProduct(result.product.id);

    return {
      applied: true,
      mode,
      adapter: tickData.adapterName,
      ...result,
    };
  }

  async listOutbox(productId?: string) {
    return this.prisma.homeGoldOutbox.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        product: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async getPriceHistory(filters: { productId?: string; productName?: string }) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        badge: true,
        subtitle: true,
        purity: true,
        buyPrice: true,
        sellPrice: true,
      },
    });

    let selectedProduct = products[0] ?? null;
    if (filters.productId?.trim()) {
      selectedProduct =
        products.find((p) => p.id === filters.productId?.trim()) ??
        selectedProduct;
    } else if (filters.productName?.trim()) {
      const targetName = filters.productName.trim();
      selectedProduct =
        products.find(
          (p) => p.name === targetName || p.name.includes(targetName)
        ) ?? selectedProduct;
    }

    const ticks = selectedProduct
      ? (
          await this.prisma.priceTick.findMany({
            where: { productId: selectedProduct.id },
            orderBy: { recordedAt: "desc" },
            take: 50,
          })
        ).reverse()
      : [];

    return {
      products,
      selectedProduct,
      ticks,
    };
  }

  async getBoardFreshness() {
    const [thresholdSetting, latestTick] = await Promise.all([
      this.prisma.setting.findUnique({
        where: { key: "price_stale_threshold_seconds" },
      }),
      this.prisma.priceTick.findFirst({
        orderBy: { recordedAt: "desc" },
        select: { recordedAt: true },
      }),
    ]);

    const envThreshold = Number(process.env.PRICE_STALE_THRESHOLD_SECONDS ?? 120);
    const settingThreshold = thresholdSetting
      ? Number(thresholdSetting.value)
      : NaN;
    const thresholdSeconds =
      Number.isFinite(settingThreshold) && settingThreshold > 0
        ? settingThreshold
        : Number.isFinite(envThreshold) && envThreshold > 0
          ? envThreshold
          : 120;

    if (!latestTick) {
      return {
        lastTickAt: null,
        elapsedSeconds: null,
        thresholdSeconds,
        isStale: true,
      };
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - latestTick.recordedAt.getTime()) / 1000)
    );

    return {
      lastTickAt: latestTick.recordedAt.toISOString(),
      elapsedSeconds,
      thresholdSeconds,
      isStale: elapsedSeconds > thresholdSeconds,
    };
  }
}
