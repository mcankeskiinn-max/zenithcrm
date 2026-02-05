-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('PENDING', 'PROCESSING', 'RESOLVED', 'FAILED');

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT,
    "status" "SupportStatus" NOT NULL DEFAULT 'PENDING',
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_messages_userId_idx" ON "support_messages"("userId");

-- CreateIndex
CREATE INDEX "support_messages_status_idx" ON "support_messages"("status");

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
