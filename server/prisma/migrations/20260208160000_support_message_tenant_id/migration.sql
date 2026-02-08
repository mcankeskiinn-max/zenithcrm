-- Add tenantId to support_messages with backfill
ALTER TABLE "support_messages" ADD COLUMN "tenantId" TEXT;

UPDATE "support_messages" sm
SET "tenantId" = u."tenantId"
FROM "users" u
WHERE sm."userId" = u."id" AND sm."tenantId" IS NULL;

ALTER TABLE "support_messages" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "support_messages_tenantId_idx" ON "support_messages"("tenantId");

ALTER TABLE "support_messages"
ADD CONSTRAINT "support_messages_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
