export interface AccountSuggestion {
    code: string;
    title: string;
    reason: string;
    confidence: 'Yuksek' | 'Orta';
}

type NaceRule = {
    prefixes: string[];
    suggestions: AccountSuggestion[];
};

const NACE_RULES: NaceRule[] = [
    {
        prefixes: ['69'],
        suggestions: [
            { code: '600', title: 'Yurtici Satislar', reason: 'Mesleki hizmet satis gelirleri', confidence: 'Yuksek' },
            { code: '770', title: 'Genel Yonetim Giderleri', reason: 'Ofis ve operasyonel giderler', confidence: 'Yuksek' },
            { code: '191', title: 'Indirilecek KDV', reason: 'Mesleki alislarda KDV indirimi', confidence: 'Orta' }
        ]
    },
    {
        prefixes: ['47', '46'],
        suggestions: [
            { code: '153', title: 'Ticari Mallar', reason: 'Perakende/toptan mal hareketleri', confidence: 'Yuksek' },
            { code: '600', title: 'Yurtici Satislar', reason: 'Mal satis gelirleri', confidence: 'Yuksek' },
            { code: '621', title: 'Satilan Ticari Mallar Maliyeti', reason: 'Satisa konu mal maliyeti', confidence: 'Orta' }
        ]
    },
    {
        prefixes: ['62', '63'],
        suggestions: [
            { code: '600', title: 'Yurtici Satislar', reason: 'Yazilim/dijital hizmet geliri', confidence: 'Yuksek' },
            { code: '740', title: 'Hizmet Uretim Maliyeti', reason: 'Yazilim ve teknik hizmet maliyetleri', confidence: 'Yuksek' },
            { code: '760', title: 'Pazarlama Satis Dagitim Giderleri', reason: 'Dijital pazarlama harcamalari', confidence: 'Orta' }
        ]
    },
    {
        prefixes: ['41', '42', '43'],
        suggestions: [
            { code: '740', title: 'Hizmet Uretim Maliyeti', reason: 'Insaat/taahhut maliyetleri', confidence: 'Yuksek' },
            { code: '600', title: 'Yurtici Satislar', reason: 'Hakediş/taahhut gelirleri', confidence: 'Yuksek' },
            { code: '320', title: 'Saticilar', reason: 'Alt yuklenici ve tedarikci borclari', confidence: 'Orta' }
        ]
    },
    {
        prefixes: ['86'],
        suggestions: [
            { code: '602', title: 'Diger Gelirler', reason: 'Saglik hizmet gelirleri', confidence: 'Yuksek' },
            { code: '770', title: 'Genel Yonetim Giderleri', reason: 'Klinik/yonetim giderleri', confidence: 'Orta' },
            { code: '760', title: 'Pazarlama Satis Dagitim Giderleri', reason: 'Hasta kazanimi/pazarlama giderleri', confidence: 'Orta' }
        ]
    }
];

const DEFAULT_SUGGESTIONS: AccountSuggestion[] = [
    { code: '600', title: 'Yurtici Satislar', reason: 'Gelir belgeleri icin temel hesap', confidence: 'Orta' },
    { code: '770', title: 'Genel Yonetim Giderleri', reason: 'Operasyonel genel giderler', confidence: 'Orta' },
    { code: '191', title: 'Indirilecek KDV', reason: 'Gider belgelerinde KDV kaydi', confidence: 'Orta' }
];

const normalizeNaceForMatching = (naceCode?: string | null): string => {
    if (!naceCode) return '';
    return naceCode.replace(/\D/g, '');
};

export const getNaceAccountSuggestions = (naceCode?: string | null): AccountSuggestion[] => {
    const normalized = normalizeNaceForMatching(naceCode);
    if (!normalized) return DEFAULT_SUGGESTIONS;

    const matched = NACE_RULES.find((rule) =>
        rule.prefixes.some((prefix) => normalized.startsWith(prefix))
    );

    return matched?.suggestions || DEFAULT_SUGGESTIONS;
};

