
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
