// @ts-nocheck
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import prisma from '../prisma';
import { Role } from '../utils/constants';
import { ForecastEngine } from '../services/forecast.service';

const DASHBOARD_CACHE_TTL_MS = 30 * 1000;
const dashboardCache = new Map<string, { ts: number; data: any }>();

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const isAdmin = user.role === Role.ADMIN;

        const where: { tenantId: string; branchId?: string; employeeId?: string } = {
            tenantId: user.tenantId
        };

        if (!isAdmin) {
            if (user.branchId) {
                where.branchId = user.branchId;
            } else if (user.role === Role.MANAGER) {
                where.employeeId = user.id;
            } else {
                where.employeeId = user.id;
            }
        }

        const rangeStr = (req.query.range as string) || '6';
        const range = parseInt(rangeStr, 10) || 6;

        return await Sentry.startSpan(
            {
                name: 'dashboard.stats',
                op: 'http.server',
                attributes: {
                    range,
                    tenantId: user.tenantId,
                    isAdmin
                }
            },
            async () => {
                const cacheKey = `${user.tenantId}|${range}|${where.branchId || ''}|${where.employeeId || ''}`;
                const cached = dashboardCache.get(cacheKey);
                if (cached && Date.now() - cached.ts < DASHBOARD_CACHE_TTL_MS) {
                    res.set('Cache-Control', 'private, max-age=30');
                    return res.json({ ...cached.data, cached: true });
                }

        const chartData: { name: string; income: number; expenses: number; key: string }[] = [];
        const now = new Date();
        const startDate = new Date();

        if (range == 1) {
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                d.setDate(now.getDate() - i);
                const label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                chartData.push({
                    name: label,
                    income: 0,
                    expenses: 0,
                    key: d.toISOString().split('T')[0]
                });
            }
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
        } else {
            for (let i = range - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthLabel = d.toLocaleString('tr-TR', { month: 'short' });
                chartData.push({
                    name: monthLabel,
                    income: 0,
                    expenses: 0,
                    key: `${d.getFullYear()}-${d.getMonth()}`
                });
            }
            startDate.setFullYear(now.getFullYear());
            startDate.setMonth(now.getMonth() - (range - 1));
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }

        const results = await Promise.allSettled([
            prisma.sale.aggregate({ where: { ...where, status: 'ACTIVE' }, _sum: { amount: true } }),
            prisma.sale.count({ where: { ...where, status: 'ACTIVE' } }),
            prisma.sale.count({ where: { ...where, status: 'LEAD' } }),
            prisma.commissionLog.aggregate({ where, _sum: { amount: true } }),
            prisma.sale.aggregate({ where: { ...where, status: 'CANCELLED' }, _sum: { amount: true }, _count: true }),
            prisma.sale.groupBy({ by: ['cancelReason'], where: { ...(where as any), status: 'CANCELLED' }, _count: { id: true }, _sum: { amount: true } }),
            prisma.sale.findMany({ where: { ...where, saleDate: { gte: startDate } }, select: { saleDate: true, createdAt: true, amount: true, status: true } }),
            prisma.sale.findMany({
                where: {
                    ...where,
                    status: 'ACTIVE',
                    endDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
                },
                include: { customer: { select: { id: true, firstName: true, lastName: true } } },
                orderBy: { endDate: 'asc' },
                take: 5
            }),
            ForecastEngine.calculateForecast(user.tenantId, where.branchId, where.employeeId),
            ForecastEngine.getTargetProgress(user.tenantId, new Date().getMonth() + 1, new Date().getFullYear(), where.branchId, where.employeeId)
        ]);

        const totalSalesAgg = results[0].status == 'fulfilled' ? results[0].value : null;
        const activePolicies = results[1].status == 'fulfilled' ? results[1].value : 0;
        const newLeads = results[2].status == 'fulfilled' ? results[2].value : 0;
        const totalCommissionAgg = results[3].status == 'fulfilled' ? results[3].value : null;
        const cancellationsAgg = results[4].status == 'fulfilled' ? results[4].value : null;
        const cancellationReasons = results[5].status == 'fulfilled' ? results[5].value : [];
        const recentSales = results[6].status == 'fulfilled' ? results[6].value : [];
        const upcomingRenewals = results[7].status == 'fulfilled' ? results[7].value : [];
        const forecast = results[8].status == 'fulfilled' ? results[8].value : null;
        const targetProgress = results[9].status == 'fulfilled' ? results[9].value : null;

        const totalSales = totalSalesAgg?._sum?.amount ? Number(totalSalesAgg._sum.amount) : 0;
        const totalCommission = totalCommissionAgg?._sum?.amount ? Number(totalCommissionAgg._sum.amount) : 0;
        const cancellationLoss = cancellationsAgg?._sum?.amount ? Number(cancellationsAgg._sum.amount) : 0;
        const cancellationCount = cancellationsAgg?._count || 0;

        const cancellationBreakdown = (cancellationReasons || []).map((r: any) => ({
            name: r.cancelReason || 'Belirtilmemis',
            count: r._count?.id || 0,
            value: r._sum?.amount ? Number(r._sum.amount) : 0
        }));

        (recentSales || []).forEach((sale: any) => {
            const saleDate = new Date(sale.saleDate || sale.createdAt);
            let match;
            if (range == 1) {
                const key = saleDate.toISOString().split('T')[0];
                match = chartData.find(d => d.key === key);
            } else {
                const key = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;
                match = chartData.find(d => d.key === key);
            }
            if (match) {
                const amt = Number(sale.amount) || 0;
                if (sale.status === 'ACTIVE') match.income += amt;
                else if (sale.status === 'CANCELLED') match.expenses += amt;
            }
        });

        const finalChartData = chartData.map(({ key, ...rest }) => rest);

        const mappedRenewals = (upcomingRenewals || []).map((s: any) => ({
            ...s,
            customer: {
                ...s.customer,
                name: s.customer ? `${s.customer.firstName} ${s.customer.lastName}`.trim() : 'Bilinmeyen Musteri'
            }
        }));

        const payload = {
            v: '2.7-fixes',
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
            forecast,
            targetProgress,
            upcomingRenewals: mappedRenewals
        };

                dashboardCache.set(cacheKey, { ts: Date.now(), data: payload });
                res.set('Cache-Control', 'private, max-age=30');
                res.json(payload);
            }
        );
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
            select: {
                amount: true,
                saleId: true,
                sale: { select: { branchId: true } }
            }
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
        console.error('[BranchKPI] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to fetch branch KPI', details: message });
    }
};
