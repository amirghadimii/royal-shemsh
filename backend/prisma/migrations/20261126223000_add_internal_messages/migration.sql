-- CreateTable
CREATE TABLE "internal_messages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'NORMAL',
    "priorityColor" "NotificationColor" NOT NULL DEFAULT 'GOLD',
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_message_recipients" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_message_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "internal_messages_category_createdAt_idx" ON "internal_messages"("category", "createdAt");

-- CreateIndex
CREATE INDEX "internal_message_recipients_userId_createdAt_idx" ON "internal_message_recipients"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "internal_message_recipients_messageId_userId_key" ON "internal_message_recipients"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "internal_message_recipients" ADD CONSTRAINT "internal_message_recipients_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "internal_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
