import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { PreOrdersController } from "./preorders.controller";
import { PreOrdersService } from "./preorders.service";

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [PreOrdersController],
  providers: [PreOrdersService],
  exports: [PreOrdersService],
})
export class PreOrdersModule {}
