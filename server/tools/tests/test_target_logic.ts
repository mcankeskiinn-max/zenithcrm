
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING TARGET LOGIC TEST ---');

    // Simulate Admin setting a branch target (userId is null)
    const month = 3;
    const year = 2026;
    const branchId = 'ade284d8-8f9a-486d-9583-c77bfb62cd50'; // VALID BRANCH ID
    const amount = 50000;

    // Clean up test data first
    await prisma.salesTarget.deleteMany({
        where: {
            month,
            year,
            branchId
        }
    });

    const query = {
        month,
        year,
        userId: null,
        branchId: branchId
    };

    console.log('1. Trying to find existing target:', query);
    const existing = await prisma.salesTarget.findFirst({
        where: query
    });
    console.log('   Result:', existing);

    let target;
    if (existing) {
        console.log('2. Updating...');
        target = await prisma.salesTarget.update({
            where: { id: existing.id },
            data: { amount }
        });
    } else {
        console.log('2. Creating...');
        try {
            target = await prisma.salesTarget.create({
                data: {
                    ...query,
                    amount
                }
            });
            console.log('   Created:', target);
        } catch (error) {
            console.error('   CREATION FAILED:', error);
        }
    }

    // Now try to update it (Simulate second request)
    console.log('3. Trying to find AGAIN (should exist):', query);
    const existing2 = await prisma.salesTarget.findFirst({
        where: query
    });
    console.log('   Result 2:', existing2);

    if (existing2) {
        console.log('4. Updating again...');
        try {
            target = await prisma.salesTarget.update({
                where: { id: existing2.id },
                data: { amount: 75000 }
            });
            console.log('   Updated:', target);
        } catch (error) {
            console.error('   UPDATE FAILED:', error);
        }
    }

    console.log('--- TEST FINISHED ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
