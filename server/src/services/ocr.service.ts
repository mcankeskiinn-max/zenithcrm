import Tesseract from 'tesseract.js';
import fs from 'fs';

export class OCRService {
    private static async recognizeText(filePath: string): Promise<string> {
        const { data: { text } } = await Tesseract.recognize(filePath, 'tur');
        return text;
    }

    private static cleanupFile(filePath: string) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error('Failed to delete temp file:', err);
        }
    }

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
            identityNo: string | null;
            startDate: string | null;
            endDate: string | null;
            policyTypeKey: string | null;
        };
    }> {
        try {
            const text = await this.recognizeText(filePath);
            this.cleanupFile(filePath);

            return {
                text,
                extractedData: this.parsePolicyText(text)
            };
        } catch (error) {
            console.error('OCR Error:', error);
            throw new Error('Belge tarama islemi basarisiz oldu.');
        }
    }

    static async scanTaxPlate(filePath: string): Promise<{
        text: string;
        extractedData: {
            companyName: string | null;
            taxNumber: string | null;
            naceCode: string | null;
        };
    }> {
        try {
            const text = await this.recognizeText(filePath);
            this.cleanupFile(filePath);

            return {
                text,
                extractedData: this.parseTaxPlateText(text)
            };
        } catch (error) {
            console.error('OCR Tax Plate Error:', error);
            throw new Error('Vergi levhasi tarama islemi basarisiz oldu.');
        }
    }

    private static normalizeNaceCode(raw: string): string | null {
        const digitsOnly = raw.replace(/\D/g, '');
        if (digitsOnly.length < 4) return null;

        const normalized = digitsOnly.length >= 6 ? digitsOnly.slice(0, 6) : digitsOnly.padEnd(6, '0');
        return `${normalized.slice(0, 2)}.${normalized.slice(2, 4)}.${normalized.slice(4, 6)}`;
    }

    private static parseTaxPlateText(text: string) {
        const normalized = text
            .replace(/\s+/g, ' ')
            .replace(/[|]/g, ' ')
            .trim();

        const nacePatterns = [
            /nace\s*(?:kodu|kodu\/faaliyet\s*kodu|ana\s*faaliyet\s*kodu)?\s*[:\-]?\s*([0-9][0-9.\-\s]{3,15})/i,
            /ana\s*faaliyet\s*(?:kodu)?\s*[:\-]?\s*([0-9][0-9.\-\s]{3,15})/i,
            /faaliyet\s*kodu\s*[:\-]?\s*([0-9][0-9.\-\s]{3,15})/i
        ];

        let naceCode: string | null = null;
        for (const pattern of nacePatterns) {
            const match = normalized.match(pattern);
            if (match?.[1]) {
                naceCode = this.normalizeNaceCode(match[1]);
                if (naceCode) break;
            }
        }

        const taxNumberMatch = normalized.match(/(?:vergi\s*kimlik\s*no|vkn|vergi\s*no)\s*[:\-]?\s*(\d{10})/i);
        const companyNameMatch = normalized.match(/(?:m[üu]kellef(?:in)?\s*ad[ıi]\s*soyad[ıi]\s*\/?\s*unvan[ıi]?|unvan[ıi]?)\s*[:\-]?\s*([A-ZÇĞİÖŞÜ0-9 .,&-]{3,80})/i);

        return {
            companyName: companyNameMatch?.[1]?.trim() || null,
            taxNumber: taxNumberMatch?.[1] || null,
            naceCode
        };
    }

    /**
     * Regex based parser for Turkish Insurance Policies
     */
    private static parsePolicyText(text: string) {
        const cleanText = text
            .replace(/\|/g, '')
            .replace(/\s+/g, ' ');

        const patterns = {
            policyNumber: /(?:poliçe\s*no|ref\s*no|müşteri\s*no|teklif\s*no)\s*[:.]?\s*([0-9A-Z-\/]{5,25})/i,
            amount: /(?:net\s+prim|brüt\s+prim|toplam\s+tutar|ödenecek\s+tutar|genel\s+toplam|tutar|bedel)[:\s]*([\d.,]+)\s*(?:TL|TRY|₺)/i,
            identityNo: /(?:t\.?c\.?\s*kimlik|v\.?k\.?n?|vergi)\s*[:.]?\s*(\d{10,11})/i,
            dates: /(\d{2})[.\/-](\d{2})[.\/-](\d{4})/g,
            policyType: /(kasko|trafik|dask|konut|sağlık|ferdi kaza|işyeri|yangın)/i,
            customerName: /(?:sigortalı|müşteri|unvanı?|ad(?:ı)?\s*soy(?:adı)?)\s*[:.]?\s*([A-ZİĞÜŞÖÇ\s]{3,40})(?:\s+T\.?C\.?|\s+Vergi|\n|$)/i,
            plateNumber: /(?:plaka|araç)\s*[:.]?\s*(\d{2}\s*[A-Z]{1,3}\s*\d{2,5})/i
        };

        const extracted = {
            policyNumber: null as string | null,
            amount: null as number | null,
            customerName: null as string | null,
            plateNumber: null as string | null,
            identityNo: null as string | null,
            startDate: null as string | null,
            endDate: null as string | null,
            policyTypeKey: null as string | null
        };

        const polMatch = cleanText.match(patterns.policyNumber);
        if (polMatch) {
            extracted.policyNumber = polMatch[1].trim();
        }

        const amountMatch = cleanText.match(patterns.amount);
        if (amountMatch) {
            let raw = amountMatch[1];
            if (raw.includes(',') && raw.includes('.')) {
                const lastDot = raw.lastIndexOf('.');
                const lastComma = raw.lastIndexOf(',');
                if (lastDot > lastComma) {
                    raw = raw.replace(/,/g, '');
                } else {
                    raw = raw.replace(/\./g, '').replace(',', '.');
                }
            } else if (raw.includes(',')) {
                raw = raw.replace(',', '.');
            }

            extracted.amount = parseFloat(raw);
        }

        const identityMatch = cleanText.match(patterns.identityNo);
        if (identityMatch) {
            extracted.identityNo = identityMatch[1].trim();
        }

        const dateMatches = Array.from(cleanText.matchAll(patterns.dates));
        if (dateMatches.length >= 1) {
            const parsedDates = dateMatches.map(m => {
                const [_, d, month, y] = m;
                return new Date(`${y}-${month}-${d}`);
            }).filter(d => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());

            if (parsedDates.length > 0) {
                extracted.startDate = parsedDates[0].toISOString().split('T')[0];
                if (parsedDates.length > 1) {
                    extracted.endDate = parsedDates[parsedDates.length - 1].toISOString().split('T')[0];
                }
            }
        }

        const typeMatch = cleanText.match(patterns.policyType);
        if (typeMatch) {
            extracted.policyTypeKey = typeMatch[1].toLowerCase();
        }

        const nameMatch = cleanText.match(patterns.customerName);
        if (nameMatch) {
            const rawName = nameMatch[1].trim();
            if (rawName.length > 3) {
                extracted.customerName = rawName;
            }
        }

        const plateMatch = cleanText.match(patterns.plateNumber);
        if (plateMatch) {
            extracted.plateNumber = plateMatch[1].replace(/\s+/g, ' ').toUpperCase();
        }

        return extracted;
    }
}
