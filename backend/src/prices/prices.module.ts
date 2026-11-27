import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PreOrdersModule } from "../preorders/preorders.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { HOMEGOLD_ADAPTER } from "./homegold-adapter.interface";
import { PriceSourceService } from "./price-source.service";
import { PricesController } from "./prices.controller";
import { StagingHomeGoldStubAdapter } from "./staging-homegold-stub.adapter";

@Module({
  imports: [AuthModule, PreOrdersModule, RealtimeModule],
  controllers: [PricesController],
  providers: [
    PriceSourceService,
    {
      provide: HOMEGOLD_ADAPTER,
      useClass: StagingHomeGoldStubAdapter,
    },
  ],
  exports: [PriceSourceService],
})
export class PricesModule {}
