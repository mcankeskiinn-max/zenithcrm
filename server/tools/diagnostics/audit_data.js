const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { tenant: true }
    });
    console.log('--- USERS & TENANTS ---');
    for (const u of users) {
        const custs = await prisma.customer.count({ where: { tenantId: u.tenantId } });
        const sales = await prisma.sale.count({ where: { tenantId: u.tenantId } });
        console.log(`User: ${u.email} | Tenant: ${u.tenant.name} (${u.tenantId}) | Custs: ${custs} | Sales: ${sales}`);
    }

    const orphanCusts = await prisma.customer.count({ where: { tenantId: { equals: undefined } } });
    const orphanSales = await prisma.sale.count({ where: { tenantId: { equals: undefined } } });
    console.log(`--- ORPHANS ---`);
    console.log(`Orphan Custs: ${orphanCusts} | Orphan Sales: ${orphanSales}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
