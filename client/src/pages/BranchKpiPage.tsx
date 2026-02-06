import { useEffect, useState } from 'react';
import axios from 'axios';

type BranchKpi = {
    branchId: string;
    branchName: string;
    totalSales: number;
    activePolicies: number;
    cancellationLoss: number;
    totalCommission: number;
    upcomingRenewals: number;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0
    }).format(value || 0);

export default function BranchKpiPage() {
    const [data, setData] = useState<BranchKpi[]>([]);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const load = async (d: number) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/dashboard/branch-kpi?days=${d}`);
            setData(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Veri alınamadı');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(days);
    }, [days]);

    if (user?.role !== 'ADMIN') {
        return (
            <div className="bg-card p-12 rounded-[32px] border border-border text-center">
                <h2 className="text-xl font-bold text-foreground">Yalnızca admin erişebilir</h2>
                <p className="text-sm text-muted-foreground mt-2">Şube KPI sadece sistem yöneticilerine açıktır.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">Şube KPI Paneli</h1>
                    <p className="text-sm text-muted-foreground">Şube bazlı gelir, iptal ve yenileme görünümü.</p>
                </div>
                <div className="flex gap-2">
                    {[30, 90, 180].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border ${days === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}
                        >
                            {d} gün
                        </button>
                    ))}
                </div>
            </div>

            {loading && <div className="text-sm text-muted-foreground">Yükleniyor...</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            {!loading && data.length === 0 && (
                <div className="bg-card p-8 rounded-[28px] border border-border text-sm text-muted-foreground">
                    Bu dönem için KPI verisi bulunamadı.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.map((row) => (
                    <div key={row.branchId} className="bg-card p-6 rounded-[28px] border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground">{row.branchName}</h3>
                            <span className="text-xs font-bold text-muted-foreground">{days} gün</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Toplam Satış</p>
                                <p className="text-foreground font-bold">{formatCurrency(row.totalSales)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Toplam Komisyon</p>
                                <p className="text-foreground font-bold">{formatCurrency(row.totalCommission)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Aktif Poliçeler</p>
                                <p className="text-foreground font-bold">{row.activePolicies}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">İptal Kaybı</p>
                                <p className="text-foreground font-bold">{formatCurrency(row.cancellationLoss)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Yaklaşan Yenileme</p>
                                <p className="text-foreground font-bold">{row.upcomingRenewals}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
