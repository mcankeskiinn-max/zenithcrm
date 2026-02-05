import { Request, Response } from 'express';
import prisma from '../prisma';
import { applySaleScope, canAccessSale } from '../utils/access.util';

export const getRenewals = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const days = Math.min(Math.max(parseInt(String(req.query.days || '30'), 10) || 30, 7), 365);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const where: any = {
            status: 'ACTIVE',
            endDate: { gte: startDate, lte: endDate }
        };
        applySaleScope(where, user);

        const sales = await prisma.sale.findMany({
            where,
            include: {
                customer: { select: { id: true, firstName: true, lastName: true } },
                policyType: { select: { name: true } },
                employee: { select: { id: true, name: true } }
            },
            orderBy: { endDate: 'asc' }
        });

        const mapped = sales.map((sale) => ({
            ...sale,
            customer: sale.customer
                ? { ...sale.customer, name: `${sale.customer.firstName} ${sale.customer.lastName}`.trim() }
                : null
        }));

        res.json(mapped);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch renewals' });
    }
};

export const createRenewalTask = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { saleId } = req.params;

        const sale = await prisma.sale.findFirst({
            where: { id: saleId, tenantId: user.tenantId },
            include: { customer: true, policyType: true }
        });
        if (!sale) return res.status(404).json({ error: 'Sale not found' });

        if (!canAccessSale(user, { branchId: sale.branchId, employeeId: sale.employeeId })) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const existingTask = await prisma.task.findFirst({
            where: {
                tenantId: user.tenantId,
                title: { contains: `Yenileme:` },
                description: { contains: sale.id }
            }
        });
        if (existingTask) {
            return res.status(200).json(existingTask);
        }

        const task = await prisma.task.create({
            data: {
                title: `Yenileme: ${sale.policyNumber || sale.id.slice(0, 8)}`,
                description: `SaleId:${sale.id} - ${sale.customer?.firstName || ''} ${sale.customer?.lastName || 'Musteri'} icin yenileme takibi`,
                dueDate: sale.endDate || new Date(),
                priority: 'HIGH',
                assignedToId: sale.employeeId,
                tenantId: user.tenantId,
                customerId: sale.customerId || undefined
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create renewal task' });
    }
};
