import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const queries = [
    { name: 'sales_invalid_customer', sql: `SELECT s.id, s.tenantId, s.customerId FROM sales s JOIN customers c ON c.id = s.customerId WHERE s.customerId IS NOT NULL AND s.tenantId <> c.tenantId` },
    { name: 'sales_invalid_branch', sql: `SELECT s.id, s.tenantId, s.branchId FROM sales s JOIN branches b ON b.id = s.branchId WHERE s.tenantId <> b.tenantId` },
    { name: 'sales_invalid_employee', sql: `SELECT s.id, s.tenantId, s.employeeId FROM sales s JOIN users u ON u.id = s.employeeId WHERE s.tenantId <> u.tenantId` },
    { name: 'task_invalid_assignee', sql: `SELECT t.id, t.tenantId, t.assignedToId FROM tasks t JOIN users u ON u.id = t.assignedToId WHERE t.tenantId <> u.tenantId` }
];

const run = async () => {
    const report: Record<string, unknown> = { checkedAt: new Date().toISOString(), issues: {} };
    for (const q of queries) {
        const rows = await prisma.$queryRawUnsafe(q.sql);
        (report.issues as any)[q.name] = rows;
    }
    console.log(JSON.stringify(report, null, 2));
    await prisma.$disconnect();
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
