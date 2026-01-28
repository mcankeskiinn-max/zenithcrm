import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';

export const getMonthlyPerformance = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const isAdmin = user.role === 'ADMIN' || user.role === 'MANAGER';

        const where: any = { status: 'ACTIVE' };
        if (!isAdmin) {
            where.employeeId = user.id;
        }

        // Get sales from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);

        const sales = await prisma.sale.findMany({
            where: {
                ...where,
                createdAt: { gte: sixMonthsAgo }
            },
            select: {
                amount: true,
                createdAt: true
            }
        });

        // Group by month
        const monthlyData: { [key: string]: { month: string, total: number, count: number } } = {};

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
            monthlyData[monthKey] = { month: monthKey, total: 0, count: 0 };
        }

        sales.forEach(sale => {
            const monthKey = new Date(sale.createdAt).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].total += (sale.amount as any).toNumber();
                monthlyData[monthKey].count += 1;
            }
        });

        // Convert to array and reverse to get chronological order
        const result = Object.values(monthlyData).reverse();

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch monthly performance' });
    }
};

export const getBranchComparison = async (req: Request, res: Response) => {
    try {
        const branches = await prisma.branch.findMany({
            include: {
                _count: {
                    select: { sales: { where: { status: 'ACTIVE' } } }
                }
            }
        });

        const result = branches.map(b => ({
            name: b.name,
            salesCount: b._count.sales
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch branch comparison' });
    }
};
