ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "naceCode" TEXT;

CREATE INDEX IF NOT EXISTS "customers_naceCode_idx" ON "customers"("naceCode");
