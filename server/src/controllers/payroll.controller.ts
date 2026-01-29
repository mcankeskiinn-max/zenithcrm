import { Request, Response } from 'express';
import prisma from '../prisma';
import { generateProfessionalPDF } from '../utils/pdf.util';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Prisma } from '@prisma/client';

export const getPayrollSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId, userId } = req.query;
        const currentUser = req.user!;

        const sDate = startDate ? new Date(startDate as string) : startOfMonth(new Date());
        const eDate = endDate ? new Date(endDate as string) : endOfMonth(new Date());

        const where: Prisma.SaleWhereInput = {
            saleDate: {
                gte: sDate,
                lte: eDate
            },
            status: 'ACTIVE'
        };

        if (branchId) where.branchId = branchId as string;
        if (userId) where.employeeId = userId as string;

        // Restriction for Managers
        if (currentUser.role === 'MANAGER') {
            where.branchId = currentUser.branchId;
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                employee: { select: { name: true } },
                branch: { select: { name: true } },
                commissionLogs: true
            }
        });

        // Calculate Totals
        const totalSales = sales.length;
        const totalAmount = sales.reduce((sum, s) => sum + Number(s.amount), 0);
        const totalCommission = sales.reduce((sum, s) => {
            const saleCommission = s.commissionLogs.reduce((cSum, log) => cSum + Number(log.amount), 0);
            return sum + saleCommission;
        }, 0);

        res.json({
            period: { start: sDate, end: eDate },
            stats: {
                totalSales,
                totalAmount,
                totalCommission
            },
            sales: sales.map(s => {
                const commAmount = s.commissionLogs.reduce((cSum, log) => cSum + Number(log.amount), 0);
                return {
                    id: s.id,
                    date: s.saleDate,
                    customer: s.customerName,
                    amount: s.amount,
                    employee: s.employee.name,
                    branch: s.branch.name,
                    estimatedCommission: commAmount
                };
            })
        });
    } catch (error) {
        console.error('Payroll summary error:', error);
        res.status(500).json({ error: 'Bordro özeti hazırlanırken hata oluştu.' });
    }
};

export const exportPayrollPDF = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId, userId } = req.query;
        const currentUser = req.user!;

        const sDate = startDate ? new Date(startDate as string) : startOfMonth(new Date());
        const eDate = endDate ? new Date(endDate as string) : endOfMonth(new Date());

        const where: Prisma.SaleWhereInput = {
            saleDate: { gte: sDate, lte: eDate },
            status: 'ACTIVE'
        };

        if (branchId) where.branchId = branchId as string;
        if (userId) where.employeeId = userId as string;

        // Restriction for Managers
        if (currentUser.role === 'MANAGER') {
            where.branchId = currentUser.branchId;
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                employee: { select: { name: true } },
                branch: { select: { name: true } },
                commissionLogs: true
            }
        });

        const totalAmount = sales.reduce((sum, s) => sum + Number(s.amount), 0);
        const totalCommission = sales.reduce((sum, s) => {
            const saleCommission = s.commissionLogs.reduce((cSum, log) => cSum + Number(log.amount), 0);
            return sum + saleCommission;
        }, 0);

        const filename = `Bordro_${format(sDate, 'yyyy-MM')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        generateProfessionalPDF(res, {
            title: 'KOMİSYON HAK EDİŞ BORDROSU',
            subtitle: `${format(sDate, 'dd MMMM yyyy', { locale: tr })} - ${format(eDate, 'dd MMMM yyyy', { locale: tr })}`,
            companyName: 'ZENITH SIGORTA',
            date: format(new Date(), 'dd.MM.yyyy HH:mm'),
            details: [
                { label: 'Toplam Satış Adedi', value: sales.length },
                { label: 'Toplam Ciro', value: `${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` },
                { label: 'Net Komisyon Tutarı', value: `${totalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` }
            ],
            table: {
                headers: ['Tarih', 'Müşteri', 'Personel', 'Tutar', 'Komisyon'],
                rows: sales.map(s => {
                    const commAmount = s.commissionLogs.reduce((cSum, log) => cSum + Number(log.amount), 0);
                    return [
                        format(s.saleDate || new Date(), 'dd.MM.yyyy'),
                        s.customerName,
                        s.employee.name,
                        `${Number(s.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
                        `${commAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                    ];
                })
            },
            footer: 'Bu belge sistem tarafından otomatik oluşturulmuştur. Mali müşavir onayı gerektirmez.'
        });

    } catch (error) {
        console.error('Payroll PDF error:', error);
        res.status(500).json({ error: 'PDF oluşturulurken hata oluştu.' });
    }
};
