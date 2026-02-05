const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:./prisma/dev.db'
        }
    }
});

async function main() {
    try {
        const sales = await prisma.sale.count();
        const customers = await prisma.customer.count();
        const tenants = await prisma.tenant.count();
        const users = await prisma.user.count();
        console.log(JSON.stringify({ sales, customers, tenants, users }));
    } catch (e) {
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
