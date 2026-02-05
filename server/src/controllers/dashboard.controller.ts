// @ts-nocheck
import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';
import { ForecastEngine } from '../services/forecast.service';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const isAdmin = user.role === Role.ADMIN;

        const where: { tenantId: string; branchId?: string; employeeId?: string } = {
            tenantId: user.tenantId
        };

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
            totalSales = totalSalesAgg._sum.amount ? Number(totalSalesAgg._sum.amount) : 0;
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
            totalCommission = totalCommissionAgg._sum.amount ? Number(totalCommissionAgg._sum.amount) : 0;
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
            cancellationLoss = cancellationsAgg._sum.amount ? Number(cancellationsAgg._sum.amount) : 0;
            cancellationCount = cancellationsAgg._count;
        } catch (e) { }

        // 6. Cancellation Reasons Distribution
        let cancellationBreakdown: { name: string; count: number; value: number }[] = [];
        try {
            // @ts-ignore
            const cancellationReasons = await prisma.sale.groupBy({
                by: ['cancelReason'],
                where: { ...(where as any), status: 'CANCELLED' },
                _count: { id: true },
                _sum: { amount: true }
            });

            cancellationBreakdown = cancellationReasons.map(r => ({
                name: r.cancelReason || 'Belirtilmemiş',
                // @ts-ignore
                count: r._count?.id || 0,
                // @ts-ignore
                value: r._sum?.amount ? Number(r._sum.amount) : 0
            }));
        } catch (e) { }

        // 7. Dynamic Range & Granularity Chart Data
        const rangeStr = (req.query.range as string) || '6';
        const range = parseInt(rangeStr) || 6;
        const chartData: { name: string; income: number; expenses: number; key: string }[] = [];

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
                    saleDate: { gte: startDate },
                },
                select: { saleDate: true, createdAt: true, amount: true, status: true },
            });

            recentSales.forEach(sale => {
                const saleDate = new Date(sale.saleDate || (sale as any).createdAt);
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
            forecast: await ForecastEngine.calculateForecast(user.tenantId, where.branchId, where.employeeId),
            targetProgress: await ForecastEngine.getTargetProgress(
                user.tenantId,
                new Date().getMonth() + 1,
                new Date().getFullYear(),
                where.branchId,
                where.employeeId
            ),
            upcomingRenewals: (await prisma.sale.findMany({
                where: {
                    ...where,
                    status: 'ACTIVE',
                    endDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    customer: { select: { id: true, firstName: true, lastName: true } }
                },
                orderBy: { endDate: 'asc' },
                take: 5
            })).map(s => ({
                ...s,
                customer: {
                    ...s.customer,
                    name: s.customer ? `${s.customer.firstName} ${s.customer.lastName}`.trim() : 'Bilinmeyen Müşteri'
                }
            }))
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const setSalesTarget = async (req: Request, res: Response) => {
    try {
        const { amount, month, year, userId, branchId } = req.body;
        const currentUser = req.user!;

        let targetBranchId = branchId;
        // Enforce Manager's branch
        if (currentUser.role === Role.MANAGER) {
            targetBranchId = currentUser.branchId;
        }

        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        if (targetBranchId) {
            const branchExists = await prisma.branch.findUnique({
                where: { id: targetBranchId }
            });
            if (!branchExists) {
                return res.status(400).json({ error: 'Bağlı olduğunuz şube sistemde bulunamadı. Lütfen yöneticinizle iletişime geçin.' });
            }
        }

        const period = `${year}-${month.toString().padStart(2, '0')}`;

        // Ensure we have some default values for required fields if they are missing
        const query = {
            tenantId: currentUser.tenantId,
            period,
            userId: userId || currentUser.id, // Fallback to current user if no specific user targeted
            branchId: targetBranchId || currentUser.branchId || ''
        };

        const existing = await prisma.salesTarget.findFirst({
            where: query
        });

        let target;
        if (existing) {
            target = await prisma.salesTarget.update({
                where: { id: existing.id },
                data: { amount: parseFloat(amount) }
            });
        } else {
            target = await prisma.salesTarget.create({
                data: {
                    ...query,
                    amount: parseFloat(amount)
                }
            });
        }

        res.json(target);
    } catch (error: unknown) {
        console.error('Set Target Error:', error);
        res.status(500).json({ error: 'Failed to set target' });
    }
};

export const getBranchKpi = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        if (user.role !== Role.ADMIN) {
            return res.status(403).json({ error: 'Only admins can view branch KPI' });
        }

        const days = Math.min(Math.max(parseInt(String(req.query.days || '30'), 10) || 30, 7), 365);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const branches = await prisma.branch.findMany({
            where: { tenantId: user.tenantId },
            select: { id: true, name: true }
        });

        const sales = await prisma.sale.findMany({
            where: {
                tenantId: user.tenantId,
                saleDate: { gte: startDate }
            },
            select: { branchId: true, amount: true, status: true, endDate: true }
        });

        const commissions = await prisma.commissionLog.findMany({
            where: {
                tenantId: user.tenantId,
                createdAt: { gte: startDate }
            },
            select: { amount: true, saleId: true },
            include: { sale: { select: { branchId: true } } }
        });

        const renewalWindow = new Date();
        renewalWindow.setDate(renewalWindow.getDate() + 30);

        const renewals = await prisma.sale.findMany({
            where: {
                tenantId: user.tenantId,
                status: 'ACTIVE',
                endDate: { gte: new Date(), lte: renewalWindow }
            },
            select: { branchId: true }
        });

        const byBranch = new Map<string, any>();
        branches.forEach((b) => {
            byBranch.set(b.id, {
                branchId: b.id,
                branchName: b.name,
                totalSales: 0,
                activePolicies: 0,
                cancellationLoss: 0,
                totalCommission: 0,
                upcomingRenewals: 0
            });
        });

        sales.forEach((sale) => {
            const entry = byBranch.get(sale.branchId);
            if (!entry) return;
            const amt = Number(sale.amount) || 0;
            if (sale.status === 'ACTIVE') {
                entry.totalSales += amt;
                entry.activePolicies += 1;
            } else if (sale.status === 'CANCELLED') {
                entry.cancellationLoss += amt;
            }
        });

        commissions.forEach((log) => {
            const branchId = log.sale?.branchId;
            if (!branchId) return;
            const entry = byBranch.get(branchId);
            if (!entry) return;
            entry.totalCommission += Number(log.amount) || 0;
        });

        renewals.forEach((sale) => {
            const entry = byBranch.get(sale.branchId);
            if (entry) entry.upcomingRenewals += 1;
        });

        res.json(Array.from(byBranch.values()));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch branch KPI' });
    }
};
