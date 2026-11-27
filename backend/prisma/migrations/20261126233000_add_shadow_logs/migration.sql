-- CreateTable
CREATE TABLE "shadow_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,0) NOT NULL,
    "totalAmount" DECIMAL(20,0) NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shadow_logs_createdAt_idx" ON "shadow_logs"("createdAt");

-- CreateIndex
CREATE INDEX "shadow_logs_orderId_idx" ON "shadow_logs"("orderId");
