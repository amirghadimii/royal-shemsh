-- CreateTable
CREATE TABLE "user_group_products" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "user_group_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_group_products_groupId_productId_key" ON "user_group_products"("groupId", "productId");

-- AddForeignKey
ALTER TABLE "user_group_products" ADD CONSTRAINT "user_group_products_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_products" ADD CONSTRAINT "user_group_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
