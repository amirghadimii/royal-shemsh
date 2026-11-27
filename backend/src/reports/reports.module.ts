import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PricesModule } from "../prices/prices.module";
import { AdminReportsController } from "./admin-reports.controller";
import { AdminReportsService } from "./admin-reports.service";
import {
  CUSTOMER_PL_SOURCE,
  LocalLedgerCustomerPlSource,
} from "./customer-pl.source";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [AuthModule, PricesModule],
  controllers: [ReportsController, AdminReportsController],
  providers: [
    AdminReportsService,
    {
      provide: CUSTOMER_PL_SOURCE,
      useClass: LocalLedgerCustomerPlSource,
    },
  ],
})
export class ReportsModule {}
