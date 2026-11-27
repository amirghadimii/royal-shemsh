import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateProductInput {
  code?: string;
  name?: string;
  badge?: string;
  subtitle?: string;
  unit?: string;
  purity?: string | null;
  productGroupId?: string;
  buyPrice?: string | number;
  sellPrice?: string | number;
  minOrder?: string | number;
  maxOrder?: string | number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  badge?: string;
  subtitle?: string;
  unit?: string;
  purity?: string | null;
  productGroupId?: string;
  buyPrice?: string | number;
  sellPrice?: string | number;
  minOrder?: string | number;
  maxOrder?: string | number;
  isActive?: boolean;
}

function parseDecimal(
  raw: string | number | undefined,
  fieldLabel: string
): Prisma.Decimal {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new BadRequestException(`${fieldLabel} الزامی است`);
  }
  try {
    const dec = new Prisma.Decimal(String(raw).trim());
    if (!dec.isFinite() || dec.lte(0)) {
      throw new BadRequestException(`${fieldLabel} باید بزرگ‌تر از صفر باشد`);
    }
    return dec;
  } catch (err) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException(`${fieldLabel} معتبر نیست`);
  }
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProductGroups() {
    return this.prisma.productGroup.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async listProducts() {
    return this.prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        productGroup: { select: { id: true, code: true, name: true } },
        _count: { select: { orders: true, trades: true, priceTicks: true } },
      },
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        productGroup: { select: { id: true, code: true, name: true } },
        priceTicks: { orderBy: { recordedAt: "desc" }, take: 10 },
        _count: { select: { orders: true, trades: true, priceTicks: true } },
      },
    });
    if (!product) {
      throw new NotFoundException("کالای مورد نظر یافت نشد");
    }
    return product;
  }

  async createProduct(input: CreateProductInput) {
    const name = input.name?.trim() ?? "";
    if (!name) {
      throw new BadRequestException("نام کالا الزامی است");
    }

    const buyPrice = parseDecimal(input.buyPrice, "قیمت خرید");
    const sellPrice = parseDecimal(input.sellPrice, "قیمت فروش");
    const minOrder = parseDecimal(input.minOrder, "حداقل سفارش");
    const maxOrder = parseDecimal(input.maxOrder, "حداکثر سفارش");

    if (minOrder.gt(maxOrder)) {
      throw new BadRequestException(
        "حداقل سفارش نمی‌تواند بیشتر از حداکثر سفارش باشد"
      );
    }

    let productGroupId = input.productGroupId?.trim();
    if (!productGroupId) {
      const firstGroup = await this.prisma.productGroup.findFirst({
        orderBy: { sortOrder: "asc" },
      });
      if (!firstGroup) {
        throw new BadRequestException("گروه کالایی یافت نشد");
      }
      productGroupId = firstGroup.id;
    } else {
      const grp = await this.prisma.productGroup.findUnique({
        where: { id: productGroupId },
      });
      if (!grp) {
        throw new BadRequestException("گروه کالایی انتخاب‌شده معتبر نیست");
      }
    }

    const maxSort = await this.prisma.product.aggregate({
      _max: { sortOrder: true },
    });
    const nextSort = (maxSort._max.sortOrder ?? 0) + 1;
    const code =
      input.code?.trim() ||
      `PRD_${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          code,
          name,
          badge: input.badge?.trim() || "طلا ۱۸ عیار",
          subtitle: input.subtitle?.trim() || "معامله آنلاین",
          unit: input.unit?.trim() || "گرم",
          purity: input.purity?.trim() || null,
          productGroupId,
          buyPrice,
          sellPrice,
          minOrder,
          maxOrder,
          sortOrder: nextSort,
          isActive: input.isActive ?? true,
        },
        include: {
          productGroup: { select: { id: true, code: true, name: true } },
        },
      });

      await tx.priceTick.create({
        data: {
          productId: created.id,
          buyPrice,
          sellPrice,
          source: "ADMIN_MANUAL",
        },
      });

      return created;
    });
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("کالای مورد نظر یافت نشد");
    }

    const buyPrice =
      input.buyPrice !== undefined
        ? parseDecimal(input.buyPrice, "قیمت خرید")
        : existing.buyPrice;
    const sellPrice =
      input.sellPrice !== undefined
        ? parseDecimal(input.sellPrice, "قیمت فروش")
        : existing.sellPrice;
    const minOrder =
      input.minOrder !== undefined
        ? parseDecimal(input.minOrder, "حداقل سفارش")
        : existing.minOrder;
    const maxOrder =
      input.maxOrder !== undefined
        ? parseDecimal(input.maxOrder, "حداکثر سفارش")
        : existing.maxOrder;

    if (minOrder.gt(maxOrder)) {
      throw new BadRequestException(
        "حداقل سفارش نمی‌تواند بیشتر از حداکثر سفارش باشد"
      );
    }

    const pricesChanged =
      !buyPrice.eq(existing.buyPrice) || !sellPrice.eq(existing.sellPrice);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.badge !== undefined ? { badge: input.badge.trim() } : {}),
          ...(input.subtitle !== undefined
            ? { subtitle: input.subtitle.trim() }
            : {}),
          ...(input.unit !== undefined ? { unit: input.unit.trim() } : {}),
          ...(input.purity !== undefined ? { purity: input.purity } : {}),
          ...(input.productGroupId !== undefined
            ? { productGroupId: input.productGroupId }
            : {}),
          ...(input.isActive !== undefined
            ? { isActive: Boolean(input.isActive) }
            : {}),
          buyPrice,
          sellPrice,
          minOrder,
          maxOrder,
        },
        include: {
          productGroup: { select: { id: true, code: true, name: true } },
        },
      });

      if (pricesChanged) {
        await tx.priceTick.create({
          data: {
            productId: id,
            buyPrice,
            sellPrice,
            source: "ADMIN_MANUAL",
          },
        });
      }

      return updated;
    });
  }

  async setProductStatus(id: string, isActive: boolean) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("کالای مورد نظر یافت نشد");
    }
    return this.prisma.product.update({
      where: { id },
      data: { isActive },
      include: {
        productGroup: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async reorderProducts(orderedIds: string[]) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestException("لیست ترتیب کالاها الزامی است");
    }
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.product.updateMany({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
    return this.listProducts();
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true, preOrders: true, trades: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException("کالای مورد نظر یافت نشد");
    }

    if (
      existing._count.orders > 0 ||
      existing._count.preOrders > 0 ||
      existing._count.trades > 0
    ) {
      throw new BadRequestException(
        "امکان حذف کالای دارای سفارش یا معامله وجود ندارد؛ می‌توانید آن را غیرفعال کنید"
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return { ok: true, deletedId: id };
  }
}
