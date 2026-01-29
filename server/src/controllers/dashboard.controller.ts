import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const isAdmin = user.role === Role.ADMIN;

        const where: any = {};

        // ADMIN sees EVERYTHING (no where clause for branch)
        if (!isAdmin) {
            if (user.branchId) {
                where.branchId = user.branchId;
            } else if (user.role === Role.MANAGER) {
                // Defensive: Managers SHOULD have a branch. If none, they see only their own inputs.
                where.employeeId = user.id;
            } else {
                // Employees see only their own data
                where.employeeId = user.id;
            }
        }



        // 1. Total Sales Amount (ACTIVE ones)
        let totalSales = 0;
        try {
            const totalSalesAgg = await prisma.sale.aggregate({
                where: { ...where, status: 'ACTIVE' },
                _sum: { amount: true }
            });
            totalSales = totalSalesAgg._sum.amount ? (totalSalesAgg._sum.amount as any).toNumber() : 0;
        } catch (e) { }

        // 2. Active Policies
        let activePolicies = 0;
        try {
            activePolicies = await prisma.sale.count({
                where: { ...where, status: 'ACTIVE' }
            });
        } catch (e) { }

        // 3. New Leads
        let newLeads = 0;
        try {
            newLeads = await prisma.sale.count({
                where: { ...where, status: 'LEAD' }
            });
        } catch (e) { }

        // 4. Total Commission
        let totalCommission = 0;
        try {
            const totalCommissionAgg = await prisma.commissionLog.aggregate({
                where,
                _sum: { amount: true }
            });
            totalCommission = totalCommissionAgg._sum.amount ? (totalCommissionAgg._sum.amount as any).toNumber() : 0;
        } catch (e) { }

        // 5. Cancellation Stats
        let cancellationLoss = 0;
        let cancellationCount = 0;
        try {
            const cancellationsAgg = await prisma.sale.aggregate({
                where: { ...where, status: 'CANCELLED' },
                _sum: { amount: true },
                _count: true
            });
            cancellationLoss = cancellationsAgg._sum.amount ? (cancellationsAgg._sum.amount as any).toNumber() : 0;
            cancellationCount = cancellationsAgg._count;
        } catch (e) { }

        // 6. Cancellation Reasons Distribution
        let cancellationBreakdown: any[] = [];
        try {
            const cancellationReasons = await prisma.sale.groupBy({
                by: ['cancelReason'],
                where: { ...where, status: 'CANCELLED' },
                _count: { id: true },
                _sum: { amount: true }
            });

            cancellationBreakdown = cancellationReasons.map(r => ({
                name: r.cancelReason || 'Belirtilmemiş',
                count: r._count.id,
                value: r._sum.amount ? (r._sum.amount as any).toNumber() : 0
            }));
        } catch (e) { }

        // 7. Dynamic Range & Granularity Chart Data
        const rangeStr = (req.query.range as string) || '6';
        const range = parseInt(rangeStr) || 6;
        const chartData: any[] = [];

        try {
            const now = new Date();
            const startDate = new Date();

            if (range === 1) {
                // Daily granularity for 1 month
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    d.setDate(now.getDate() - i);
                    const label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                    chartData.push({
                        name: label,
                        income: 0,
                        expenses: 0,
                        key: d.toISOString().split('T')[0] // YYYY-MM-DD
                    });
                }
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
            } else {
                // Monthly granularity for others (3, 6, 12 months)
                for (let i = range - 1; i >= 0; i--) {
                    // Get the first day of each target month safely
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthLabel = d.toLocaleString('tr-TR', { month: 'short' });
                    chartData.push({
                        name: monthLabel,
                        income: 0,
                        expenses: 0,
                        key: `${d.getFullYear()}-${d.getMonth()}` // Unique Month Key
                    });
                }
                startDate.setFullYear(now.getFullYear());
                startDate.setMonth(now.getMonth() - (range - 1));
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
            }

            const recentSales = await prisma.sale.findMany({
                where: {
                    ...where,
                    createdAt: { gte: startDate },
                },
                select: { createdAt: true, amount: true, status: true },
            });

            recentSales.forEach(sale => {
                const saleDate = new Date(sale.createdAt);
                let match;

                if (range === 1) {
                    const key = saleDate.toISOString().split('T')[0];
                    match = chartData.find(d => d.key === key);
                } else {
                    const key = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;
                    match = chartData.find(d => d.key === key);
                }

                if (match) {
                    const amt = Number(sale.amount) || 0;
                    if (sale.status === 'ACTIVE') {
                        match.income += amt;
                    } else if (sale.status === 'CANCELLED') {
                        match.expenses += amt;
                    }
                }
            });
        } catch (e) { }

        // Clean up keys before sending to frontend
        const finalChartData = chartData.map(({ key, ...rest }) => rest);



        res.json({
            v: "2.7-fixes",
            cards: {
                totalSales,
                activePolicies,
                newLeads,
                totalCommission,
                cancellationLoss,
                cancellationCount
            },
            chartData: finalChartData,
            cancellationBreakdown,
            upcomingRenewals: await prisma.sale.findMany({
                where: {
                    ...where,
                    status: 'ACTIVE',
                    endDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    customer: { select: { id: true, name: true } }
                },
                orderBy: { endDate: 'asc' },
                take: 5
            })
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
