import { useEffect, useState } from 'react';
import axios from 'axios';

type RenewalItem = {
    id: string;
    policyNumber?: string | null;
    endDate?: string | null;
    customer?: { id: string; name: string };
    policyType?: { name: string };
    employee?: { id: string; name: string };
};

export default function RenewalsPage() {
    const [items, setItems] = useState<RenewalItem[]>([]);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async (d: number) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/renewals?days=${d}`);
            setItems(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Yenilemeler yuklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(days);
    }, [days]);

    const createTask = async (saleId: string) => {
        try {
            await axios.post(`/api/renewals/${saleId}/task`, {});
            await load(days);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gorev olusturma basarisiz');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">Yenilemeler</h1>
                    <p className="text-sm text-muted-foreground">Yaklasan policeler ve yenileme takibi</p>
                </div>
                <div className="flex gap-2">
                    {[30, 60, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border ${days === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
                        >
                            {d} gun
                        </button>
                    ))}
                </div>
            </div>

            {loading && <div className="text-sm text-muted-foreground">Yukleniyor...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="bg-card rounded-[28px] border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                            <th className="text-left px-4 py-3">Musteri</th>
                            <th className="text-left px-4 py-3">Police</th>
                            <th className="text-left px-4 py-3">Bitis</th>
                            <th className="text-left px-4 py-3">Personel</th>
                            <th className="text-right px-4 py-3">Islem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-t border-border/60">
                                <td className="px-4 py-3 font-semibold">{item.customer?.name || 'Musteri'}</td>
                                <td className="px-4 py-3">{item.policyNumber || '—'}</td>
                                <td className="px-4 py-3">{item.endDate ? new Date(item.endDate).toLocaleDateString('tr-TR') : '—'}</td>
                                <td className="px-4 py-3">{item.employee?.name || '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => createTask(item.id)}
                                        className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        Gorev Olustur
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                    Kayit bulunamadi.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
