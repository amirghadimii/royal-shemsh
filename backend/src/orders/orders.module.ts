import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PricesModule } from "../prices/prices.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [AuthModule, PricesModule, RealtimeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
