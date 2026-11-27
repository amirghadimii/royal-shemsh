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
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  type CreateProductInput,
  ProductsService,
  type UpdateProductInput,
} from "./products.service";

@Controller("admin")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("ADMIN", "SYSTEM_MANAGER")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get("product-groups")
  async getGroups() {
    const groups = await this.productsService.listProductGroups();
    return { groups };
  }

  @Get("products")
  async list() {
    const products = await this.productsService.listProducts();
    return { products };
  }

  @Get("products/:id")
  async getOne(@Param("id") id: string) {
    const product = await this.productsService.getProduct(id);
    return { product };
  }

  @Post("products")
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateProductInput) {
    const product = await this.productsService.createProduct(body ?? {});
    return { product };
  }

  @Put("products/reorder")
  async reorder(@Body() body: { orderedIds?: string[] }) {
    const products = await this.productsService.reorderProducts(
      body?.orderedIds ?? []
    );
    return { products };
  }

  @Patch("products/:id")
  async update(@Param("id") id: string, @Body() body: UpdateProductInput) {
    const product = await this.productsService.updateProduct(id, body ?? {});
    return { product };
  }

  @Patch("products/:id/status")
  async setStatus(
    @Param("id") id: string,
    @Body() body: { isActive?: boolean }
  ) {
    const product = await this.productsService.setProductStatus(
      id,
      Boolean(body?.isActive)
    );
    return { product };
  }

  @Delete("products/:id")
  async remove(@Param("id") id: string) {
    return this.productsService.deleteProduct(id);
  }
}
