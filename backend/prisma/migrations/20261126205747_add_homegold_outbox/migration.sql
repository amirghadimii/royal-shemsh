-- CreateTable
CREATE TABLE "homegold_outbox" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyPrice" DECIMAL(18,0) NOT NULL,
    "sellPrice" DECIMAL(18,0) NOT NULL,
    "mode" TEXT NOT NULL DEFAULT '3',
    "status" TEXT NOT NULL DEFAULT 'QUEUED_STUB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homegold_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homegold_outbox_productId_createdAt_idx" ON "homegold_outbox"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "homegold_outbox" ADD CONSTRAINT "homegold_outbox_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
