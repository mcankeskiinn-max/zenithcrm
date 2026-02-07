-- Sales composite indexes for dashboard and filters
CREATE INDEX IF NOT EXISTS "sales_tenantId_status_idx" ON "sales"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "sales_tenantId_saleDate_idx" ON "sales"("tenantId", "saleDate");
CREATE INDEX IF NOT EXISTS "sales_tenantId_branchId_idx" ON "sales"("tenantId", "branchId");

-- Task index for approvals and assigned lists
CREATE INDEX IF NOT EXISTS "tasks_tenantId_isCompleted_assignedToId_idx" ON "tasks"("tenantId", "isCompleted", "assignedToId");

-- Commission logs for dashboard aggregations
CREATE INDEX IF NOT EXISTS "commission_logs_tenantId_createdAt_idx" ON "commission_logs"("tenantId", "createdAt");
