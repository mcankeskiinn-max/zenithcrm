-- Drop global unique constraint on policyNumber
DROP INDEX IF EXISTS "sales_policyNumber_key";

-- Enforce unique policy numbers per tenant
CREATE UNIQUE INDEX "sales_tenantId_policyNumber_key" ON "sales"("tenantId", "policyNumber");
