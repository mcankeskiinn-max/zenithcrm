import { Request, Response } from 'express';
import prisma from '../prisma';
import * as XLSX from 'xlsx';
import { startOfDay, endOfDay } from 'date-fns';

export const exportSalesToExcel = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, branchId, policyTypeId, status } = req.query;
        const user = (req as any).user;

        // Base where clause
        const where: any = {};

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
            where.status = status as string;
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                branch: { select: { name: true } },
                policyType: { select: { name: true } },
                employee: { select: { name: true } }
            },
            orderBy: { saleDate: 'desc' }
        });

        // Format data for Excel
        const data = sales.map(sale => ({
            'Satış Tarihi': sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('tr-TR') : '-',
            'Müşteri Adı': sale.customerName,
            'Poliçe No': sale.policyNumber || '-',
            'Branş': sale.policyType.name,
            'Şube': sale.branch.name,
            'Personel': sale.employee.name,
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
