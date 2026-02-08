import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mode = (process.argv.find((arg) => arg.startsWith('--mode=')) || '--mode=dry').split('=')[1];
const strategy = (process.argv.find((arg) => arg.startsWith('--strategy=')) || '--strategy=detach').split('=')[1];

const isDry = mode !== 'live';

const log = (message: string, extra?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', message, ...extra }));
};

const run = async () => {
    log('Tenant fix starting', { mode, strategy });

    if (strategy === 'detach') {
        if (isDry) {
            log('Dry run: would detach nullable foreign keys');
        } else {
            await prisma.sale.updateMany({
                where: { customerId: { not: null } },
                data: { customerId: null }
            });

            await prisma.task.updateMany({
                where: { customerId: { not: null } },
                data: { customerId: null }
            });

            await prisma.task.updateMany({
                where: { policyTypeId: { not: null } },
                data: { policyTypeId: null }
            });

            await prisma.document.updateMany({
                where: { customerId: { not: null } },
                data: { customerId: null }
            });

            await prisma.document.updateMany({
                where: { saleId: { not: null } },
                data: { saleId: null }
            });
        }
    }

    if (strategy === 'delete') {
        if (isDry) {
            log('Dry run: would delete cross-tenant child rows (risky)');
        } else {
            await prisma.document.deleteMany({
                where: { customerId: { not: null } }
            });
        }
    }

    if (strategy === 'reassign') {
        log('Reassign strategy requires manual mapping. Skipped.');
    }

    log(isDry ? 'Dry run completed' : 'Live fix completed');
    await prisma.$disconnect();
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
