// @ts-nocheck
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
            OR: [
                {
                    saleDate: {
                        gte: sDate,
                        lte: eDate
                    }
                },
                {
                    saleDate: null,
                    createdAt: {
                        gte: sDate,
                        lte: eDate
                    }
                }
            ],
            status: 'ACTIVE',
            tenantId: currentUser.tenantId
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
        console.log('📄 PDF export request:', req.query);

        const { startDate, endDate, branchId, userId } = req.query;
        const currentUser = req.user!;

        const sDate = startDate ? new Date(startDate as string) : startOfMonth(new Date());
        const eDate = endDate ? new Date(endDate as string) : endOfMonth(new Date());

        console.log('📅 Date range:', { sDate, eDate, tenantId: currentUser.tenantId });

        const where: Prisma.SaleWhereInput = {
            OR: [
                { saleDate: { gte: sDate, lte: eDate } },
                { saleDate: null, createdAt: { gte: sDate, lte: eDate } }
            ],
            status: 'ACTIVE',
            tenantId: currentUser.tenantId
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

        console.log(`📊 Found ${sales.length} sales for PDF`);

        if (sales.length === 0) {
            console.warn('⚠️ No sales found for PDF export');
            return res.status(404).json({
                error: 'Seçilen tarih aralığında aktif satış bulunamadı.'
            });
        }

        const totalAmount = sales.reduce((sum, s) => sum + Number(s.amount), 0);
        const totalCommission = sales.reduce((sum, s) => {
            const saleCommission = s.commissionLogs.reduce((cSum, log) => cSum + Number(log.amount), 0);
            return sum + saleCommission;
        }, 0);

        const filename = `Bordro_${format(sDate, 'yyyy-MM')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        console.log('🔨 Generating PDF...', { totalAmount, totalCommission });

        // Build subtitle with filter info
        let subtitle = `${format(sDate, 'dd MMMM yyyy', { locale: tr })} - ${format(eDate, 'dd MMMM yyyy', { locale: tr })}`;

        if (branchId) {
            const branch = await prisma.branch.findUnique({
                where: { id: branchId as string },
                select: { name: true }
            });
            if (branch) subtitle += ` | Şube: ${branch.name}`;
        }

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId as string },
                select: { name: true }
            });
            if (user) subtitle += ` | Personel: ${user.name}`;
        }

        generateProfessionalPDF(res, {
            title: 'KOMİSYON HAK EDİŞ BORDROSU',
            subtitle,
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
                        format(s.saleDate || s.createdAt, 'dd.MM.yyyy'),
                        s.customerName || 'Bilinmeyen',
                        s.employee?.name || 'Bilinmeyen',
                        `${Number(s.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
                        `${commAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                    ];
                })
            },
            footer: 'Bu belge sistem tarafından otomatik oluşturulmuştur. Mali müşavir onayı gerektirmez.'
        });

        console.log('✅ PDF generated successfully');

    } catch (error) {
        console.error('❌ Payroll PDF error:', error);
        res.status(500).json({ error: 'PDF oluşturulurken hata oluştu: ' + (error as Error).message });
    }
};
