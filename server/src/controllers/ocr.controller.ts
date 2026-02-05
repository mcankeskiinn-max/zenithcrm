
import { Request, Response } from 'express';
import { OCRService } from '../services/ocr.service';
import fs from 'fs';

export const scanPolicy = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Lütfen bir dosya yükleyin.' });
        }

        const filePath = req.file.path;
        console.log('Processing OCR for file:', filePath);

        const result = await OCRService.scanPolicy(filePath);

        // Check if any significant data was found
        const hasData = result.extractedData.policyNumber ||
            result.extractedData.customerName ||
            result.extractedData.identityNo;

        if (!hasData) {
            return res.status(422).json({
                error: 'Belge okundu ancak poliçe verileri (Poliçe No, İsim veya TCKN) ayrıştırılamadı. Lütfen dökümanın net ve okunaklı olduğundan emin olun.',
                success: false,
                rawText: result.text
            });
        }

        res.json({
            success: true,
            data: result.extractedData,
            rawText: result.text
        });

    } catch (error) {
        // Clean up file if error occurs and it still exists
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Failed to cleanup file after error:', e);
            }
        }

        console.error('OCR Controller Error:', error);
        res.status(500).json({ error: 'Belge taranırken bir hata oluştu.' });
    }
};
