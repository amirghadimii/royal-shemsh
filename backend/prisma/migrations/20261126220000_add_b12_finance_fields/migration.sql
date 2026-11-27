-- AlterTable
ALTER TABLE "user_groups" ADD COLUMN "leaderName" TEXT;
ALTER TABLE "user_groups" ADD COLUMN "commissionRateToman" DECIMAL(18,0) NOT NULL DEFAULT 65000;

-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN "productId" TEXT;

-- AlterTable
ALTER TABLE "remittances" ADD COLUMN "productId" TEXT;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
