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
    const [success, setSuccess] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/approvals');
            setItems(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Onaylar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handle = async (id: string, action: 'approve' | 'reject') => {
        setError('');
        setSuccess('');
        setBusyId(id);
        try {
            await axios.post(`/api/approvals/${id}/${action}`, {});
            setSuccess(action === 'approve' ? 'Onay başarıyla verildi.' : 'Talep reddedildi.');
            await load();
        } catch (err: any) {
            setError(err.response?.data?.error || 'İşlem başarısız');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-foreground">Onaylar</h1>
                <p className="text-sm text-muted-foreground">İptal ve komisyon onay talepleri</p>
            </div>

            {loading && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">{success}</div>}

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
                                    {item.approval?.customerName || 'Müşteri'} • {item.approval?.policyNumber || item.approval?.saleId}
                                </p>
                                {item.approval?.reason && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Gerekçe: {item.approval.reason}
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
                                disabled={busyId === item.id}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {busyId === item.id ? 'İşleniyor...' : 'Onayla'}
                            </button>
                            <button
                                onClick={() => handle(item.id, 'reject')}
                                disabled={busyId === item.id}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {busyId === item.id ? 'İşleniyor...' : 'Reddet'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
