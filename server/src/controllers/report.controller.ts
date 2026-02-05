import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import * as XLSX from 'xlsx';
import { startOfDay, endOfDay, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { SaleStatus } from '@prisma/client';
import { generateProfessionalPDF, PDFData } from '../utils/pdf.util';

export const exportSalesToExcel = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId, policyTypeId, status } = req.query;
        const user = req.user!;

        // Base where clause
        const where: {
            saleDate?: { gte: Date; lte: Date };
            branchId?: string;
            policyTypeId?: string;
            status?: SaleStatus;
        } = {};

        // Date filter
        if (startDate && endDate) {
            where.saleDate = {
                gte: startOfDay(new Date(startDate as string)),
                lte: endOfDay(new Date(endDate as string))
            };
        }

        // Branch filter - Employee only sees their own branch, Manager see theirs, Admin see all
        if (user.role === 'EMPLOYEE' || user.role === 'MANAGER') {
            where.branchId = user.branchId;
        } else if (branchId) {
            where.branchId = branchId as string;
        }

        // Policy Type filter
        if (policyTypeId) {
            where.policyTypeId = policyTypeId as string;
        }

        // Status filter
        if (status) {
            where.status = status as SaleStatus;
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                branch: { select: { name: true } },
                policyType: { select: { name: true } },
                employee: { select: { name: true } }
            },
            orderBy: { saleDate: 'desc' }
        }) as any[];

        // Format data for Excel
        const data = sales.map(sale => ({
            'Satış Tarihi': sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('tr-TR') : '-',
            'Müşteri Adı': sale.customerName,
            'Poliçe No': sale.policyNumber || '-',
            'Branş': sale.policyType?.name || '-',
            'Şube': sale.branch?.name || '-',
            'Personel': sale.employee?.name || '-',
            'Net Prim (₺)': Number(sale.amount),
            'Durum': sale.status,
            'Vade Başlangıç': sale.startDate ? new Date(sale.startDate).toLocaleDateString('tr-TR') : '-',
            'Vade Bitiş': sale.endDate ? new Date(sale.endDate).toLocaleDateString('tr-TR') : '-'
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Satislar');

        // Set column widths
        const columnWidths = [
            { wch: 15 }, // Satış Tarihi
            { wch: 25 }, // Müşteri Adı
            { wch: 20 }, // Poliçe No
            { wch: 15 }, // Branş
            { wch: 15 }, // Şube
            { wch: 20 }, // Personel
            { wch: 15 }, // Net Prim
            { wch: 12 }, // Durum
            { wch: 15 }, // Vade Başlangıç
            { wch: 15 }  // Vade Bitiş
        ];
        worksheet['!cols'] = columnWidths;

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for download
        const filename = `Satis_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        return res.send(buffer);

    } catch (error) {
        console.error('Export Excel error:', error);
        return res.status(500).json({ error: 'Rapor oluşturulurken bir hata oluştu' });
    }
};

export const exportCustomerPDF = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        const customer = await prisma.customer.findFirst({
            where: {
                id,
                tenantId: user.tenantId
            },
            include: {
                sales: {
                    include: {
                        policyType: { select: { name: true } },
                        branch: { select: { name: true } }
                    },
                    orderBy: { saleDate: 'desc' }
                },
                tenant: { select: { name: true } }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }

        const data: PDFData = {
            title: 'MÜŞTERİ ÖZET RAPORU',
            subtitle: `${customer.firstName} ${customer.lastName}`,
            date: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }),
            companyName: customer.tenant?.name || 'ZENITH CRM',
            details: [
                { label: 'Ad Soyad', value: `${customer.firstName} ${customer.lastName}` },
                { label: 'Telefon', value: customer.phone || '-' },
                { label: 'E-posta', value: customer.email || '-' },
                { label: 'Adres', value: customer.address || '-' }
            ],
            table: {
                headers: ['Poliçe No', 'Branş', 'Tarih', 'Tutar'],
                rows: customer.sales.map(sale => [
                    sale.policyNumber || '-',
                    sale.policyType?.name || '-',
                    sale.saleDate ? format(new Date(sale.saleDate), 'dd.MM.yyyy') : '-',
                    `${Number(sale.amount).toLocaleString('tr-TR')} ₺`
                ])
            },
            footer: 'Bu rapor Zenith CRM tarafından oluşturulmuştur.'
        };

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Musteri_Ozeti_${customer.lastName}.pdf`);

        generateProfessionalPDF(res, data);

    } catch (error) {
        console.error('Export PDF error:', error);
        return res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu' });
    }
};
