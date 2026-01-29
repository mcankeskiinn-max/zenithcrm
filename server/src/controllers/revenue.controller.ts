import { Request, Response } from 'express';
import prisma from '../prisma';
import { startOfYear, endOfYear, eachMonthOfInterval, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';

export class RevenueController {

    // 1. Aylık/Yıllık Gelir Trendleri
    static async getRevenueTrends(req: Request, res: Response) {
        try {
            const currentYear = new Date().getFullYear();
            const startDate = startOfYear(new Date(currentYear, 0, 1));
            const endDate = endOfYear(new Date(currentYear, 11, 31));

            // Get verified sales (ACTIVE or OFFER converted to ACTIVE scenarios usually, but here we check ACTIVE)
            // Or maybe just all sales with an amount? Let's assume 'ACTIVE' represents closed deals.
            const sales = await prisma.sale.findMany({
                where: {
                    status: 'ACTIVE',
                    saleDate: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // Group by month
            const months = eachMonthOfInterval({ start: startDate, end: new Date() }); // Up to current month

            const trends = months.map(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);

                const monthSales = sales.filter(s => {
                    const d = s.saleDate || s.createdAt; // Fallback to createdAt
                    return d >= monthStart && d <= monthEnd;
                });

                const totalRevenue = monthSales.reduce((sum, sale) => sum + Number(sale.amount), 0);

                return {
                    month: format(month, 'MMMM', { locale: tr }),
                    revenue: totalRevenue,
                    count: monthSales.length
                };
            });

            res.json(trends);
        } catch (error) {
            console.error('Revenue Trends Error:', error);
            res.status(500).json({ error: 'Failed to fetch revenue trends' });
        }
    }

    // 2. Müşteri Karlılık Analizi (Pareto / LTV)
    static async getCustomerProfitability(req: Request, res: Response) {
        try {
            const customers = await prisma.customer.findMany({
                include: {
                    sales: {
                        where: { status: 'ACTIVE' }
                    }
                }
            });

            const profitability = customers.map(c => {
                const totalRevenue = c.sales.reduce((sum, s) => sum + Number(s.amount), 0);
                return {
                    id: c.id,
                    name: c.name,
                    totalRevenue,
                    saleCount: c.sales.length,
                    averageOrderValue: c.sales.length > 0 ? totalRevenue / c.sales.length : 0
                };
            });

            // Sort by revenue desc
            profitability.sort((a, b) => b.totalRevenue - a.totalRevenue);

            // Calculate Pareto segments (Top 20% = Gold, Next 30% = Silver, Rest = Bronze)
            const top20Index = Math.floor(profitability.length * 0.2);
            const next30Index = Math.floor(profitability.length * 0.5);

            const result = profitability.map((p, index) => ({
                ...p,
                segment: index < top20Index ? 'Gold' : (index < next30Index ? 'Silver' : 'Bronze')
            }));

            res.json(result.slice(0, 50)); // Return top 50 for dashboard
        } catch (error) {
            console.error('Profitability Error:', error);
            res.status(500).json({ error: 'Failed to fetch customer profitability' });
        }
    }

    // 3. Churn Riski (Basit Tahmin)
    // Logic: Active sales ending in next 30 days AND no open OFFER/task for them
    static async getChurnRisks(req: Request, res: Response) {
        try {
            const today = new Date();
            const next30Days = new Date();
            next30Days.setDate(today.getDate() + 30);

            const expiringSales = await prisma.sale.findMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gte: today,
                        lte: next30Days
                    }
                },
                include: {
                    customer: true,
                    tasks: true // Check if any tasks exist for this sale
                }
            });

            const highRisk = expiringSales.filter(s => {
                // If there are NO incomplete tasks linked to this sale/customer, it's high risk
                // Or if there is no Renewal Offer created (we could check for sales with OFFER status for same customer)
                const hasOpenTasks = s.tasks.some(t => !t.isCompleted);
                return !hasOpenTasks;
            });

            const risks = highRisk.map(s => ({
                id: s.id,
                customerName: s.customerName,
                policyNumber: s.policyNumber,
                endDate: s.endDate,
                amount: Number(s.amount),
                riskLavel: 'HIGH', // Logic can be improved
                daysLeft: Math.ceil((new Date(s.endDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            }));

            res.json(risks);
        } catch (error) {
            console.error('Churn Risk Error:', error);
            res.status(500).json({ error: 'Failed to fetch churn risks' });
        }
    }

    // 4. Hedef vs Gerçekleşen
    static async getTargetRealization(req: Request, res: Response) {
        try {
            const currentMonth = new Date().getMonth() + 1; // 1-12
            const currentYear = new Date().getFullYear();

            // Get Target Sum
            const targets = await prisma.salesTarget.aggregate({
                _sum: { amount: true },
                where: {
                    month: currentMonth,
                    year: currentYear
                }
            });

            // Get Actual Sales Sum
            const startStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const startDate = new Date(startStr);
            const endDate = endOfMonth(startDate);

            const actuals = await prisma.sale.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'ACTIVE',
                    saleDate: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            const targetAmount = Number(targets._sum.amount) || 0;
            const actualAmount = Number(actuals._sum.amount) || 0;

            res.json({
                month: currentMonth,
                year: currentYear,
                target: targetAmount,
                actual: actualAmount,
                percentage: targetAmount > 0 ? (actualAmount / targetAmount) * 100 : 0
            });

        } catch (error) {
            console.error('Target Realization Error:', error);
            res.status(500).json({ error: 'Failed to fetch target realization' });
        }
    }
}
