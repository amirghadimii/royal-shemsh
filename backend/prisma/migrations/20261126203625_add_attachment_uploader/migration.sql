-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "storedName" TEXT,
ADD COLUMN     "uploadedById" TEXT;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
