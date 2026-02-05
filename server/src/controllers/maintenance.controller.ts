import { Request, Response } from 'express';
import prisma from '../prisma';

const TEST_POLICY_PREFIX = 'POL-TEST';
const TEST_NAME_PREFIX = 'Test';
const TEST_EMAIL_PREFIX = 'test';
const CONFIRM_TOKEN = 'DELETE_TEST_DATA';

export const cleanupTestData = async (req: Request, res: Response) => {
    const currentUser = req.user!;
    const confirm = String((req.body && req.body.confirm) || '');
    const dryRun = confirm !== CONFIRM_TOKEN;

    try {
        const testCustomers = await prisma.customer.findMany({
            where: {
                tenantId: currentUser.tenantId,
                OR: [
                    { firstName: { startsWith: TEST_NAME_PREFIX, mode: 'insensitive' } },
                    { lastName: { startsWith: TEST_NAME_PREFIX, mode: 'insensitive' } },
                    { email: { startsWith: TEST_EMAIL_PREFIX, mode: 'insensitive' } }
                ]
            },
            select: { id: true }
        });

        const testSales = await prisma.sale.findMany({
            where: {
                tenantId: currentUser.tenantId,
                OR: [
                    { policyNumber: { startsWith: TEST_POLICY_PREFIX, mode: 'insensitive' } },
                    { notes: { contains: TEST_NAME_PREFIX, mode: 'insensitive' } }
                ]
            },
            select: { id: true }
        });

        const customerIds = testCustomers.map((c) => c.id);
        const saleIds = testSales.map((s) => s.id);

        const counts = {
            customers: customerIds.length,
            sales: saleIds.length,
            tasks: 0,
            documents: 0,
            messages: 0,
            commissionLogs: 0
        };

        if (customerIds.length) {
            counts.tasks = await prisma.task.count({ where: { tenantId: currentUser.tenantId, customerId: { in: customerIds } } });
            counts.documents = await prisma.document.count({ where: { tenantId: currentUser.tenantId, customerId: { in: customerIds } } });
        }
        if (saleIds.length) {
            counts.messages = await prisma.message.count({ where: { tenantId: currentUser.tenantId, saleId: { in: saleIds } } });
            counts.commissionLogs = await prisma.commissionLog.count({ where: { tenantId: currentUser.tenantId, saleId: { in: saleIds } } });
            counts.documents += await prisma.document.count({ where: { tenantId: currentUser.tenantId, saleId: { in: saleIds } } });
        }

        if (dryRun) {
            return res.json({
                dryRun: true,
                confirmToken: CONFIRM_TOKEN,
                counts
            });
        }

        await prisma.$transaction(async (tx) => {
            if (saleIds.length) {
                await tx.message.deleteMany({ where: { tenantId: currentUser.tenantId, saleId: { in: saleIds } } });
                await tx.commissionLog.deleteMany({ where: { tenantId: currentUser.tenantId, saleId: { in: saleIds } } });
                await tx.document.deleteMany({ where: { tenantId: currentUser.tenantId, saleId: { in: saleIds } } });
            }
            if (customerIds.length) {
                await tx.task.deleteMany({ where: { tenantId: currentUser.tenantId, customerId: { in: customerIds } } });
                await tx.document.deleteMany({ where: { tenantId: currentUser.tenantId, customerId: { in: customerIds } } });
            }
            if (saleIds.length) {
                await tx.sale.deleteMany({ where: { tenantId: currentUser.tenantId, id: { in: saleIds } } });
            }
            if (customerIds.length) {
                await tx.customer.deleteMany({ where: { tenantId: currentUser.tenantId, id: { in: customerIds } } });
            }
        });

        return res.json({
            dryRun: false,
            deleted: counts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Test data cleanup failed' });
    }
};
