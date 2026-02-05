import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';
import { applySaleScope } from '../utils/access.util';

export const getMonthlyPerformance = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { startDate, endDate } = req.query;
        const where: any = {
            status: 'ACTIVE'
        };
        applySaleScope(where, user);

        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) where.saleDate.gte = new Date(startDate as string);
            if (endDate) {
                const d = new Date(endDate as string);
                d.setHours(23, 59, 59, 999);
                where.saleDate.lte = d;
            }
        } else {
            // Default to last 6 months
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            sixMonthsAgo.setDate(1);
            where.saleDate = { gte: sixMonthsAgo };
        }

        const sales = await prisma.sale.findMany({
            where,
            select: {
                amount: true,
                saleDate: true,
                createdAt: true
            }
        });

        // Group by month
        const monthlyData: { [key: string]: { month: string, total: number, count: number } } = {};

        sales.forEach(sale => {
            const dateObj = sale.saleDate || (sale as any).createdAt;
            const monthKey = new Date(dateObj).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthKey, total: 0, count: 0 };
            }
            monthlyData[monthKey].total += Number(sale.amount);
            monthlyData[monthKey].count += 1;
        });

        const result = Object.values(monthlyData);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch monthly performance' });
    }
};

export const getBranchComparison = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const { startDate, endDate } = req.query;

        const salesWhere: any = { status: 'ACTIVE' };
        applySaleScope(salesWhere, currentUser);
        if (startDate || endDate) {
            salesWhere.saleDate = {};
            if (startDate) salesWhere.saleDate.gte = new Date(startDate as string);
            if (endDate) {
                const d = new Date(endDate as string);
                d.setHours(23, 59, 59, 999);
                salesWhere.saleDate.lte = d;
            }
        }

        const branchWhere: any = { tenantId: currentUser.tenantId };
        if (currentUser.role !== Role.ADMIN) {
            if (currentUser.branchId) {
                branchWhere.id = currentUser.branchId;
            } else {
                return res.json([]);
            }
        }

        const branches = await prisma.branch.findMany({
            where: branchWhere,
            include: {
                sales: {
                    where: salesWhere,
                    select: { amount: true }
                }
            }
        });

        const result = branches.map(b => ({
            name: b.name,
            salesCount: b.sales.length,
            totalAmount: b.sales.reduce((sum, s) => sum + Number(s.amount), 0)
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch branch comparison' });
    }
};

export const getPolicyTypeDistribution = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const { startDate, endDate } = req.query;

        const where: any = {
            status: 'ACTIVE'
        };
        applySaleScope(where, currentUser);

        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) where.saleDate.gte = new Date(startDate as string);
            if (endDate) {
                const d = new Date(endDate as string);
                d.setHours(23, 59, 59, 999);
                where.saleDate.lte = d;
            }
        }

        const distribution = await prisma.sale.groupBy({
            by: ['policyTypeId'],
            where,
            _sum: { amount: true },
            _count: true
        });

        // Get policy type names
        const policyTypes = await prisma.policyType.findMany({
            where: { tenantId: currentUser.tenantId },
            select: { id: true, name: true }
        });

        const result = distribution.map(d => {
            const pt = policyTypes.find(t => t.id === d.policyTypeId);
            return {
                name: pt ? pt.name : 'Unknown',
                count: d._count,
                total: Number(d._sum.amount || 0)
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch policy type distribution' });
    }
};

export const getEmployeePerformance = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const { startDate, endDate } = req.query;

        const where: any = {
            status: 'ACTIVE'
        };
        applySaleScope(where, currentUser);

        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) where.saleDate.gte = new Date(startDate as string);
            if (endDate) {
                const d = new Date(endDate as string);
                d.setHours(23, 59, 59, 999);
                where.saleDate.lte = d;
            }
        }

        const performance = await prisma.sale.groupBy({
            by: ['employeeId'],
            where,
            _sum: { amount: true },
            _count: true
        });

        const employeesWhere: any = { tenantId: currentUser.tenantId };
        if (currentUser.role === Role.MANAGER) {
            if (currentUser.branchId) {
                employeesWhere.branchId = currentUser.branchId;
            } else {
                return res.json([]);
            }
        } else if (currentUser.role === Role.EMPLOYEE) {
            employeesWhere.id = currentUser.id;
        }

        const employees = await prisma.user.findMany({
            where: employeesWhere,
            select: { id: true, name: true }
        });

        const result = performance.map(p => {
            const emp = employees.find(e => e.id === p.employeeId);
            return {
                name: emp ? emp.name : 'Unknown',
                count: p._count,
                total: Number(p._sum.amount || 0)
            };
        }).sort((a, b) => b.total - a.total);

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employee performance' });
    }
};

export const getTargetProgress = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const period = `${year}-${String(month).padStart(2, '0')}`;

        const targetsWhere: any = {
            tenantId: currentUser.tenantId,
            period
        };
        if (currentUser.role === Role.MANAGER) {
            if (currentUser.branchId) {
                targetsWhere.branchId = currentUser.branchId;
            } else {
                return res.json({ month, year, target: 0, actual: 0, percent: 0 });
            }
        } else if (currentUser.role === Role.EMPLOYEE) {
            targetsWhere.userId = currentUser.id;
        }

        const targets = await prisma.salesTarget.findMany({
            where: targetsWhere
        });

        const salesWhere: any = {
            status: 'ACTIVE',
            saleDate: {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1)
            }
        };
        applySaleScope(salesWhere, currentUser);

        const currentMonthSales = await prisma.sale.aggregate({
            where: salesWhere,
            _sum: { amount: true }
        });

        const totalTarget = targets.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalActual = Number(currentMonthSales._sum.amount || 0);

        res.json({
            month,
            year,
            target: totalTarget,
            actual: totalActual,
            percent: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch target progress' });
    }
};
export const getYearlyPerformance = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        const where: any = {
            status: 'ACTIVE'
        };
        applySaleScope(where, user);

        // Fetch sales for current year and last year
        const sales = await prisma.sale.findMany({
            where: {
                ...where,
                saleDate: {
                    gte: new Date(lastYear, 0, 1),
                    lte: new Date(currentYear, 11, 31, 23, 59, 59, 999)
                }
            },
            select: {
                amount: true,
                saleDate: true,
                createdAt: true
            }
        });

        const months = [
            'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
            'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
        ];

        const yearlyData: { [key: number]: { month: string, currentYear: number, lastYear: number } } = {};

        // Initialize months
        months.forEach((month, index) => {
            yearlyData[index] = { month, currentYear: 0, lastYear: 0 };
        });

        sales.forEach(sale => {
            const date = new Date(sale.saleDate || (sale as any).createdAt);
            const monthIndex = date.getMonth();
            const year = date.getFullYear();

            if (year === currentYear) {
                yearlyData[monthIndex].currentYear += Number(sale.amount);
            } else if (year === lastYear) {
                yearlyData[monthIndex].lastYear += Number(sale.amount);
            }
        });

        res.json(Object.values(yearlyData));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch yearly performance' });
    }
};











