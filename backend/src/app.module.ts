import { Module } from "@nestjs/common";
import { AccountingModule } from "./accounting/accounting.module";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { AttachmentsModule } from "./attachments/attachments.module";
import { AuthModule } from "./auth/auth.module";
import { BoardModule } from "./board/board.module";
import { MessagesModule } from "./messages/messages.module";
import { OrdersModule } from "./orders/orders.module";
import { PreOrdersModule } from "./preorders/preorders.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PricesModule } from "./prices/prices.module";
import { ProductsModule } from "./products/products.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { RedisModule } from "./redis/redis.module";
import { RemittancesModule } from "./remittances/remittances.module";
import { ReportsModule } from "./reports/reports.module";
import { TradesModule } from "./trades/trades.module";

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    AccountingModule,
    AdminModule,
    AttachmentsModule,
    MessagesModule,
    OrdersModule,
    PreOrdersModule,
    PricesModule,
    ProductsModule,
    RealtimeModule,
    RemittancesModule,
    ReportsModule,
    TradesModule,
    BoardModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
