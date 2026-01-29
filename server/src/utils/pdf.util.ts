import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface PDFData {
    title: string;
    subtitle?: string;
    date: string;
    companyName: string;
    details: { label: string; value: string | number }[];
    table?: {
        headers: string[];
        rows: (string | number)[][];
    };
    footer?: string;
}

export const generateProfessionalPDF = (res: Response, data: PDFData) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF directly to the response
    doc.pipe(res);

    // Header - Company Branding
    doc.fillColor('#F97316') // Orange-500
        .fontSize(24)
        .text(data.companyName.toUpperCase(), { align: 'right' });

    doc.fillColor('#4B5563') // Gray-600
        .fontSize(10)
        .text('Sigorta Yönetim Sistemi - Finansal Bordro', { align: 'right' });

    doc.moveDown(2);

    // Title
    doc.fillColor('#111827') // Gray-900
        .fontSize(20)
        .text(data.title, { underline: true });

    if (data.subtitle) {
        doc.fontSize(12)
            .fillColor('#4B5563')
            .text(data.subtitle);
    }

    doc.fontSize(10)
        .text(`Oluşturulma Tarihi: ${data.date}`, { align: 'right' });

    doc.moveDown(2);

    // Details Section
    doc.fillColor('#111827').fontSize(12);
    data.details.forEach(detail => {
        doc.text(`${detail.label}: `, { continued: true })
            .font('Helvetica-Bold')
            .text(`${detail.value}`)
            .font('Helvetica');
    });

    doc.moveDown(2);

    // Table Section (If exists)
    if (data.table) {
        const tableTop = doc.y;
        const columnWidth = (doc.page.width - 100) / data.table.headers.length;

        // Table Header Background
        doc.rect(50, tableTop, doc.page.width - 100, 20)
            .fill('#F3F4F6');

        doc.fillColor('#374151')
            .font('Helvetica-Bold')
            .fontSize(10);

        data.table.headers.forEach((header, i) => {
            doc.text(header, 50 + i * columnWidth, tableTop + 5, {
                width: columnWidth,
                align: 'left'
            });
        });

        doc.font('Helvetica').fillColor('#111827');
        let currentY = tableTop + 25;

        data.table.rows.forEach((row) => {
            // Draw horizontal line
            doc.moveTo(50, currentY + 15)
                .lineTo(doc.page.width - 50, currentY + 15)
                .strokeColor('#E5E7EB')
                .stroke();

            row.forEach((cell, i) => {
                doc.text(cell.toString(), 50 + i * columnWidth, currentY, {
                    width: columnWidth,
                    align: 'left'
                });
            });
            currentY += 20;
        });
    }

    // Footer
    if (data.footer) {
        doc.fontSize(8)
            .fillColor('#9CA3AF')
            .text(data.footer, 50, doc.page.height - 50, { align: 'center' });
    }

    doc.end();
};

export interface QuoteData {
    company: string; // Branch Name or Insurance Company
    policyType: string;
    amount: number;
    startDate: string;
    endDate: string;
    features?: string[];
}

export const generateComparisonPDF = (res: Response, quotes: QuoteData[]) => {
    const doc = new PDFDocument({ margin: 40, layout: 'landscape' }); // Landscape for better comparison
    doc.pipe(res);

    // Branding
    doc.fillColor('#F97316').fontSize(24)
        .text('ZENITH CRM', { align: 'right' });
    doc.fillColor('#374151').fontSize(16).font('Helvetica-Bold')
        .text('TEKLİF KARŞILAŞTIRMA TABLOSU', 40, 40);

    doc.moveDown(2);

    const startY = 120;
    const colWidth = (doc.page.width - 80) / (quotes.length + 1); // +1 for label column
    const labelX = 40;

    // Labels
    const labels = ['Sigorta Şirketi', 'Ürün Tipi', 'Başlangıç', 'Bitiş', 'FİYAT (TL)'];
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#374151');

    labels.forEach((label, i) => {
        doc.text(label, labelX, startY + (i * 40));
        // Horizontal Line
        doc.moveTo(40, startY + (i * 40) + 25)
            .lineTo(doc.page.width - 40, startY + (i * 40) + 25)
            .strokeColor('#E5E7EB').stroke();
    });

    // Content Columns
    quotes.forEach((quote, i) => {
        const colX = labelX + colWidth + (i * colWidth);
        const isCheapest = quote.amount === Math.min(...quotes.map(q => q.amount));

        // Highlight Column Background if Cheapest
        if (isCheapest) {
            doc.rect(colX - 10, startY - 10, colWidth, 220).fill('#FFF7ED'); // Light Orange
        }

        doc.font('Helvetica').fontSize(12).fillColor('#111827');

        // Company
        doc.text(quote.company, colX, startY, { width: colWidth - 20 });

        // Policy Type
        doc.text(quote.policyType, colX, startY + 40, { width: colWidth - 20 });

        // Dates
        doc.text(quote.startDate, colX, startY + 80);
        doc.text(quote.endDate, colX, startY + 120);

        // Price (Distinct)
        doc.font('Helvetica-Bold').fontSize(14)
            .fillColor(isCheapest ? '#16A34A' : '#1F2937') // Green if cheapest
            .text(`${quote.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`, colX, startY + 160);
    });

    // Footer
    doc.fontSize(10).fillColor('#9CA3AF')
        .text('Bu tablo yalnızca bilgilendirme amaçlıdır. Nihai poliçe şartları geçerlidir.', 40, doc.page.height - 50, { align: 'center' });

    doc.end();
};
