const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, name: true, role: true }
        });
        console.log('--- DATABASE USERS ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('----------------------');
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
