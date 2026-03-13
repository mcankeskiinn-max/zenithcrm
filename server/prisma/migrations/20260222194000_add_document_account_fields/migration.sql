ALTER TABLE "documents"
ADD COLUMN IF NOT EXISTS "accountCode" TEXT,
ADD COLUMN IF NOT EXISTS "accountTitle" TEXT,
ADD COLUMN IF NOT EXISTS "accountConfidence" TEXT;

CREATE INDEX IF NOT EXISTS "documents_accountCode_idx" ON "documents"("accountCode");
