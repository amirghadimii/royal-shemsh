import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Returns a Prisma client guard where ledgerEntry delete/deleteMany throw
   * an explicit error at the ORM layer (in addition to the PostgreSQL trigger).
   */
  get immutableClient() {
    return this.$extends({
      query: {
        ledgerEntry: {
          delete() {
            throw new Error(
              "Accounting documents (ledger_entries) cannot be deleted."
            );
          },
          deleteMany() {
            throw new Error(
              "Accounting documents (ledger_entries) cannot be deleted."
            );
          },
        },
      },
    });
  }
}
