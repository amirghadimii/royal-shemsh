import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PricesModule } from "../prices/prices.module";
import { BoardController } from "./board.controller";

@Module({
  imports: [AuthModule, PricesModule],
  controllers: [BoardController],
})
export class BoardModule {}
