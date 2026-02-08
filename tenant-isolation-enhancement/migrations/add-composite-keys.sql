-- Composite key ve FK guclendirme ornekleri

-- Example: Sales - enforce tenantId + policyNumber unique already exists
-- Example: Messages - ensure tenantId in FK (application level). DB-level composite FKs below.

-- Composite foreign key examples (requires matching composite unique index)
-- ALTER TABLE customers ADD CONSTRAINT customers_tenant_pk UNIQUE (id, tenantId);
-- ALTER TABLE sales ADD CONSTRAINT sales_customer_tenant_fk FOREIGN KEY (customerId, tenantId) REFERENCES customers(id, tenantId);

-- Similar patterns for branches, users, policy_types, tasks
