import prisma from '../prisma';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

export class ForecastEngine {
    /**
     * Calculates the projected sales for the next month based on the last 6 months trend.
     * Simple Linear Trend: (Current - 6MonthsAgo) / 6 * GrowthFactor
     */
    static async calculateForecast(branchId?: string, userId?: string) {
        const now = new Date();
        const monthsToAnalyze = 6;
        const historicalData: { month: Date, total: number }[] = [];

        for (let i = 0; i <= monthsToAnalyze; i++) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const where: any = {
                status: 'ACTIVE',
                saleDate: {
                    gte: start,
                    lte: end
                }
            };

            if (branchId) where.branchId = branchId;
            if (userId) where.employeeId = userId;

            const sales = await prisma.sale.aggregate({
                where,
                _sum: {
                    amount: true
                }
            });

            // Handle potential null amount safely
            historicalData.push({
                month: start,
                total: Number(sales._sum.amount ?? 0)
            });
        }

        // Simple Trend Analysis
        // Sort from oldest to newest
        historicalData.sort((a, b) => a.month.getTime() - b.month.getTime());

        const values = historicalData.map(d => d.total);
        const n = values.length;

        // Calculate average growth rate
        let totalGrowth = 0;
        let intervals = 0;
        for (let i = 1; i < n; i++) {
            // Only calculate growth if previous month had sales to avoid division by zero
            if (values[i - 1] > 0) {
                totalGrowth += (values[i] - values[i - 1]) / values[i - 1];
                intervals++;
            }
        }

        const avgGrowth = intervals > 0 ? totalGrowth / intervals : 0;
        const currentMonthTotal = values[n - 1];

        // Forecast = Last Month * (1 + Average Growth)
        // With a floor of 0 and a sanity check cap (e.g. max 50% growth if data is sparse)
        const constrainedGrowth = Math.max(-0.5, Math.min(0.5, avgGrowth));
        const forecastedAmount = currentMonthTotal * (1 + constrainedGrowth);

        return {
            forecastedAmount: Math.round(forecastedAmount * 100) / 100,
            confidence: intervals > 3 ? 'HIGH' : 'MEDIUM',
            growthRate: Math.round(constrainedGrowth * 100)
        };
    }

    static async getTargetProgress(month: number, year: number, branchId?: string, userId?: string) {
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(new Date(year, month - 1));

        const targetWhere: any = { month, year };
        if (branchId) targetWhere.branchId = branchId;
        if (userId) targetWhere.userId = userId;

        const target = await prisma.salesTarget.aggregate({
            where: targetWhere,
            _sum: {
                amount: true
            }
        });

        const salesWhere: any = {
            status: 'ACTIVE',
            saleDate: {
                gte: start,
                lte: end
            }
        };
        if (branchId) salesWhere.branchId = branchId;
        if (userId) salesWhere.employeeId = userId;

        const currentSales = await prisma.sale.aggregate({
            where: salesWhere,
            _sum: {
                amount: true
            }
        });

        const targetAmount = Number(target._sum.amount ?? 0);
        const achievedAmount = Number(currentSales._sum.amount ?? 0);

        return {
            target: targetAmount,
            achieved: achievedAmount,
            percentage: targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 100) : 0
        };
    }
}
