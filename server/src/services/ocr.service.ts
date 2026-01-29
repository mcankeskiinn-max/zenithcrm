
import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';

export class OCRService {

    /**
     * Extracts text from an image file and parses for policy details.
     */
    static async scanPolicy(filePath: string): Promise<{
        text: string;
        extractedData: {
            policyNumber: string | null;
            amount: number | null;
            customerName: string | null;
            plateNumber: string | null;
        }
    }> {
        try {
            // Perform OCR
            const { data: { text } } = await Tesseract.recognize(
                filePath,
                'tur', // Turkish language support
            );

            // Normalize text slightly for easier matching
            // const normalizedText = text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();

            // Clean up file after processing
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error('Failed to delete temp file:', err);
            }

            return {
                text,
                extractedData: this.parsePolicyText(text)
            };

        } catch (error) {
            console.error('OCR Error:', error);
            throw new Error('Belge tarama işlemi başarısız oldu.');
        }
    }

    /**
     * Regex based parser for Turkish Insurance Policies
     */
    private static parsePolicyText(text: string) {
        // Cleaning common OCR noise
        const cleanText = text
            .replace(/\|/g, '') // Remove pipe artifacts
            .replace(/\s+/g, ' '); // Normalize whitespace

        // Improved Regex Patterns (Verified with Test Script)
        const patterns = {
            // Policy No: Explicitly look for "Müşteri No" as fallback since "Poliçe No" is missing in some docs
            policyNumber: /(?:poliçe\s*no|ref\s*no|müşteri\s*no|teklif\s*no)\s*[:.]?\s*([0-9A-Z-\/]{5,25})/i,

            // Amount: Prioritize "Net Prim", "Toplam Tutar" to avoid partial matches
            amount: /(?:net\s+prim|brüt\s+prim|toplam\s+tutar|ödenecek\s+tutar|genel\s+toplam|tutar|bedel)[:\s]*([\d.,]+)\s*(?:TL|TRY|₺)/i,

            // Matches: Sigortalı: Ahmet Müşteri
            customerName: /(?:sigortalı|müşteri|unvanı?|ad(?:ı)?\s*soy(?:adı)?)\s*[:.]?\s*([A-ZİĞÜŞÖÇ\s]{3,40})(?:\s+T\.?C\.?|\s+Vergi|\n|$)/i,

            // Matches: 34 AB 1234, 06 XYZ 99
            plateNumber: /(?:plaka|araç)\s*[:.]?\s*(\d{2}\s*[A-Z]{1,3}\s*\d{2,5})/i
        };

        const extracted = {
            policyNumber: null as string | null,
            amount: null as number | null,
            customerName: null as string | null,
            plateNumber: null as string | null
        };

        // Policy Number
        const polMatch = cleanText.match(patterns.policyNumber);
        if (polMatch) {
            extracted.policyNumber = polMatch[1].trim();
        }

        // Amount
        const amountMatch = cleanText.match(patterns.amount);
        if (amountMatch) {
            // Turkish format: 1.250,50 -> remove dot, replace comma with dot
            // OR Simple format: 1250.50
            let raw = amountMatch[1];
            if (raw.includes(',') && raw.includes('.')) {
                // Determine which is decimal separator. Usually last one.
                const lastDot = raw.lastIndexOf('.');
                const lastComma = raw.lastIndexOf(',');
                if (lastDot > lastComma) {
                    // 1,250.50 format (US/English style sometimes used)
                    raw = raw.replace(/,/g, '');
                } else {
                    // 1.250,50 format (TR standard)
                    raw = raw.replace(/\./g, '').replace(',', '.');
                }
            } else if (raw.includes(',')) {
                // 1250,50
                raw = raw.replace(',', '.');
            }
            // else 1250 or 1250.50 -> logic auto handles

            extracted.amount = parseFloat(raw);
        }

        // Customer Name
        const nameMatch = cleanText.match(patterns.customerName);
        if (nameMatch) {
            // Clean up noise
            let rawName = nameMatch[1].trim();
            // Filter out common short false positives
            if (rawName.length > 3) {
                extracted.customerName = rawName;
            }
        }

        // Plate
        const plateMatch = cleanText.match(patterns.plateNumber);
        if (plateMatch) {
            extracted.plateNumber = plateMatch[1].replace(/\s+/g, ' ').toUpperCase();
        }

        return extracted;
    }
}
