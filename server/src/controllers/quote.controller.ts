import { Request, Response } from 'express';
import prisma from '../prisma';
import { generateComparisonPDF, QuoteData } from '../utils/pdf.util';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Sale, Branch, PolicyType, Customer } from '@prisma/client';

export class QuoteController {
    // Existing compareQuotesPDF method...
    static async compareQuotesPDF(req: Request, res: Response) {
        // ... (existing implementation)
        try {
            const { saleIds } = req.body;

            if (!Array.isArray(saleIds) || saleIds.length === 0) {
                return res.status(400).json({ error: 'At least one quote must be selected' });
            }

            const sales = await prisma.sale.findMany({
                where: {
                    id: { in: saleIds }
                },
                include: {
                    branch: true,
                    policyType: true,
                    customer: true
                }
            });

            if (sales.length === 0) {
                return res.status(404).json({ error: 'No quotes found' });
            }

            type ConnectionSale = Sale & { branch: Branch; policyType: PolicyType; customer: Customer | null };

            const quotes: QuoteData[] = sales.map((sale: ConnectionSale) => ({
                company: sale.branch.name || 'Bilinmiyor',
                policyType: sale.policyType.name,
                amount: Number(sale.amount),
                startDate: sale.startDate ? format(sale.startDate, 'dd MMM yyyy', { locale: tr }) : '-',
                endDate: sale.endDate ? format(sale.endDate, 'dd MMM yyyy', { locale: tr }) : '-'
            }));

            // Set headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=tekliff_karsilastirma.pdf');

            generateComparisonPDF(res, quotes);

        } catch (error) {
            console.error('PDF Comparison Error:', error);
            res.status(500).json({ error: 'Failed to generate comparison PDF' });
        }
    }

    static async bulkUploadQuotes(req: Request, res: Response) {
        try {
            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const createdOffers = [];

            // We need a default user/branch/policyType for these partial offers
            // For now, we'll try to find defaults or use the first available ones
            // In a real scenario, these might come from the logged-in user context
            const defaultBranch = await prisma.branch.findFirst();
            const defaultPolicyType = await prisma.policyType.findFirst();
            const defaultUser = await prisma.user.findFirst(); // Should come from auth token really

            if (!defaultBranch || !defaultPolicyType || !defaultUser) {
                return res.status(500).json({ error: 'System defaults (Branch/PolicyType/User) missing.' });
            }

            // Import dynamically to avoid circular dependency issues if any
            const { OCRService } = await import('../services/ocr.service');
            // const ocrService = new OCRService(); // REMOVED instantiation

            for (const file of files) {
                const result = await OCRService.scanPolicy(file.path);
                const { policyNumber, amount, customerName } = result.extractedData;

                // Create a new Sale record with status OFFER
                // We use defaults for missing fields because OCR might not catch everything
                const newSale = await prisma.sale.create({
                    data: {
                        customerName: customerName || 'Bilinmiyor',
                        amount: amount || 0,
                        policyNumber: policyNumber || `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        status: 'OFFER',
                        branchId: defaultBranch.id,
                        policyTypeId: defaultPolicyType.id,
                        employeeId: defaultUser.id,
                        notes: 'Otomatik OCR ile oluşturuldu.'
                    }
                });
                createdOffers.push(newSale);
            }

            res.status(201).json({
                message: `${createdOffers.length} offers processed successfully`,
                offers: createdOffers
            });

        } catch (error) {
            console.error('Bulk Upload Error:', error);
            res.status(500).json({ error: 'Failed to process bulk upload' });
        }
    }
}
