import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

type Finding = {
    relation: string;
    fromId: string;
    fromTenant: string;
    toId: string;
    toTenant: string;
};

const findings: Finding[] = [];

const check = async (name: string, sql: string) => {
    const rows = await prisma.$queryRawUnsafe<any[]>(sql);
    for (const row of rows) {
        findings.push({
            relation: name,
            fromId: row.from_id,
            fromTenant: row.from_tenant,
            toId: row.to_id,
            toTenant: row.to_tenant
        });
    }
};

const run = async () => {
    await check('sale_customer', `
        SELECT s.id as from_id, s."tenantId" as from_tenant, c.id as to_id, c."tenantId" as to_tenant
        FROM sales s
        JOIN customers c ON c.id = s."customerId"
        WHERE s."customerId" IS NOT NULL AND s."tenantId" <> c."tenantId"
    `);

    await check('sale_branch', `
        SELECT s.id as from_id, s."tenantId" as from_tenant, b.id as to_id, b."tenantId" as to_tenant
        FROM sales s
        JOIN branches b ON b.id = s."branchId"
        WHERE s."tenantId" <> b."tenantId"
    `);

    await check('task_assigned_user', `
        SELECT t.id as from_id, t."tenantId" as from_tenant, u.id as to_id, u."tenantId" as to_tenant
        FROM tasks t
        JOIN users u ON u.id = t."assignedToId"
        WHERE t."tenantId" <> u."tenantId"
    `);

    await check('task_customer', `
        SELECT t.id as from_id, t."tenantId" as from_tenant, c.id as to_id, c."tenantId" as to_tenant
        FROM tasks t
        JOIN customers c ON c.id = t."customerId"
        WHERE t."customerId" IS NOT NULL AND t."tenantId" <> c."tenantId"
    `);

    await check('task_policy_type', `
        SELECT t.id as from_id, t."tenantId" as from_tenant, p.id as to_id, p."tenantId" as to_tenant
        FROM tasks t
        JOIN policy_types p ON p.id = t."policyTypeId"
        WHERE t."policyTypeId" IS NOT NULL AND t."tenantId" <> p."tenantId"
    `);

    await check('document_customer', `
        SELECT d.id as from_id, d."tenantId" as from_tenant, c.id as to_id, c."tenantId" as to_tenant
        FROM documents d
        JOIN customers c ON c.id = d."customerId"
        WHERE d."customerId" IS NOT NULL AND d."tenantId" <> c."tenantId"
    `);

    await check('document_sale', `
        SELECT d.id as from_id, d."tenantId" as from_tenant, s.id as to_id, s."tenantId" as to_tenant
        FROM documents d
        JOIN sales s ON s.id = d."saleId"
        WHERE d."saleId" IS NOT NULL AND d."tenantId" <> s."tenantId"
    `);

    await check('commission_rule_branch', `
        SELECT r.id as from_id, r."tenantId" as from_tenant, b.id as to_id, b."tenantId" as to_tenant
        FROM commission_rules r
        JOIN branches b ON b.id = r."branchId"
        WHERE r."branchId" IS NOT NULL AND r."tenantId" <> b."tenantId"
    `);

    await check('commission_rule_policy_type', `
        SELECT r.id as from_id, r."tenantId" as from_tenant, p.id as to_id, p."tenantId" as to_tenant
        FROM commission_rules r
        JOIN policy_types p ON p.id = r."policyTypeId"
        WHERE r."policyTypeId" IS NOT NULL AND r."tenantId" <> p."tenantId"
    `);

    const report = {
        generatedAt: new Date().toISOString(),
        totalViolations: findings.length,
        findings
    };

    console.log('Tenant Consistency Report');
    const grouped = findings.reduce<Record<string, number>>((acc, item) => {
        acc[item.relation] = (acc[item.relation] || 0) + 1;
        return acc;
    }, {});
    for (const [relation, count] of Object.entries(grouped)) {
        console.log(`? Found ${count} cross-tenant relations in ${relation}`);
    }

    writeFileSync('tenant-consistency-report.json', JSON.stringify(report, null, 2));
    await prisma.$disconnect();
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
