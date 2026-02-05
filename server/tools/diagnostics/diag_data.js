const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany({
        include: { _count: { select: { users: true, customers: true, sales: true } } }
    });
    tenants.forEach(t => {
        console.log(`Tenant: ${t.name} (${t.id}) | Users: ${t._count.users} | Custs: ${t._count.customers} | Sales: ${t._count.sales}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
