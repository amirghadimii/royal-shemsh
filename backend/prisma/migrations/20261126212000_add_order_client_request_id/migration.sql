-- AlterTable
ALTER TABLE "orders" ADD COLUMN "clientRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_userId_clientRequestId_key" ON "orders"("userId", "clientRequestId");
