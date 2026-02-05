
const text = `Müşteri No 135544329 Tanzim Tarihi :11/10/2024 00:00
Sigortalının Adı Soyadı : SENEM PUSAT
Sigortalının Adresi : ÖRNEKKÖYMah. 7504 Sok. Diş Kapı No:2 İç Kapı No:37 KARŞIYAKA İZMİR
TÜRKİYE
T.C. Kimlik No 1511******86
Doğum Tarihi :10.07.1989
Prim Ödeme Planı (TL) Net Prim : 17.802,95TL
BSV: — 12,30TL
11/10/2024 2.545,04 11/02/2025 2.545,03 Ödenecek Pim > İZG1ŞASTL`;

const normalizedText = text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
const cleanText = normalizedText.replace(/\|/g, '').replace(/\s+/g, ' ');

console.log('Cleaned:', cleanText);

function parse(text: string) {
    const patterns = {
        // Policy No: Try explicit "Poliçe No" first.
        // Fallback: If not found, look for "Müşteri No" as a temporary proxy (User might expect this if policy no is absent)
        policyNumber: /(?:poliçe\s*no|ref\s*no|müşteri\s*no)\s*[:.]?\s*([0-9A-Z-\/]{5,25})/i,

        // Amount: Put specific phrases FIRST (Net Prim, Toplam Tutar) to avoid partial matches on "Prim"
        // Also removed \s from the capture group to prevent capturing trailing text
        amount: /(?:net\s+prim|brüt\s+prim|toplam\s+tutar|ödenecek\s+tutar|genel\s+toplam|tutar|bedel)[:\s]*([\d.,]+)\s*(?:TL|TRY|₺)/i,

        customerName: /(?:sigortalı|müşteri|unvanı?)\s*(?:adı|ünvanı)?\s*[:.]?\s*([A-ZİĞÜŞÖÇ\s]{3,40})(?:\s+T\.?C\.?|\s+Vergi|\n|$)/i,
    };

    console.log('--- TESTING ---');

    // Amount Test
    const amountMatch = text.match(patterns.amount);
    console.log('Amount Match Full:', amountMatch ? amountMatch[0] : 'NO MATCH');
    if (amountMatch) {
        console.log('Amount Captured Group:', amountMatch[1]);
        let raw = amountMatch[1].trim();
        // Logic from service
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
        console.log('Parsed Amount:', parseFloat(raw));
    }
}

parse(cleanText);
