import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cleanupMismatchedSales = async () => {
    // Strategy: detach invalid relations to prevent cross-tenant reads.
    await prisma.$executeRawUnsafe(`UPDATE sales SET customerId = NULL WHERE id IN (
        SELECT s.id FROM sales s JOIN customers c ON c.id = s.customerId WHERE s.customerId IS NOT NULL AND s.tenantId <> c.tenantId
    )`);
    await prisma.$executeRawUnsafe(`UPDATE sales SET branchId = b.id FROM branches b WHERE sales.branchId IS NOT NULL AND sales.tenantId = b.tenantId`);
};

const run = async () => {
    await cleanupMismatchedSales();
    await prisma.$disconnect();
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
