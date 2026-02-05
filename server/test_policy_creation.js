const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
    try {
        const tenantId = '303676a5-ec74-4a47-8cb0-37c6de18cdb2';
        console.log('Using tenant:', tenantId);
        const result = await prisma.policyType.create({
            data: {
                name: 'Test Policy ' + Date.now(),
                tenantId: tenantId
            }
        });
        console.log('Success:', result);
    } catch (error) {
        console.error('CRASH:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCreate();
