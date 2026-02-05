import { useEffect, useState } from 'react';
import axios from 'axios';

type ApprovalItem = {
    id: string;
    title: string;
    description?: string;
    createdAt: string;
    approval?: {
        type?: string;
        saleId?: string;
        policyNumber?: string;
        customerName?: string;
        reason?: string;
    };
};

export default function ApprovalsPage() {
    const [items, setItems] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/approvals');
            setItems(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Onaylar yuklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handle = async (id: string, action: 'approve' | 'reject') => {
        try {
            await axios.post(`/api/approvals/${id}/${action}`, {});
            await load();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Islem basarisiz');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-foreground">Onaylar</h1>
                <p className="text-sm text-muted-foreground">Iptal ve komisyon onay talepleri</p>
            </div>

            {loading && <div className="text-sm text-muted-foreground">Yukleniyor...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="space-y-4">
                {items.length === 0 && !loading && (
                    <div className="bg-card p-8 rounded-[28px] border border-border text-sm text-muted-foreground">
                        Bekleyen onay bulunmuyor.
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.id} className="bg-card p-6 rounded-[28px] border border-border shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {item.approval?.customerName || 'Musteri'} • {item.approval?.policyNumber || item.approval?.saleId}
                                </p>
                                {item.approval?.reason && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Gerekce: {item.approval.reason}
                                    </p>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => handle(item.id, 'approve')}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                Onayla
                            </button>
                            <button
                                onClick={() => handle(item.id, 'reject')}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700"
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
