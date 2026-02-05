/*
  Warnings:

  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POLICY_RENEWAL', 'TASK_DEADLINE', 'TASK_ASSIGNED', 'SYSTEM_ALERT', 'COMMISSION_EARNED', 'CUSTOMER_BIRTHDAY');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- DropIndex
DROP INDEX "notifications_tenantId_idx";

-- DropIndex
DROP INDEX "notifications_userId_idx";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "link" TEXT,
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "relatedId" TEXT,
ADD COLUMN     "relatedType" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_tenantId_userId_isRead_idx" ON "notifications"("tenantId", "userId", "isRead");
