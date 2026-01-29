import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    RefreshCw,
    ShieldAlert,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface Stats {
    cards: {
        totalSales: number;
        activePolicies: number;
        newLeads: number;
        totalCommission: number;
        cancellationLoss: number;
        cancellationCount: number;
    };
    chartData: Array<{ name: string; income: number; expenses: number }>;
    cancellationBreakdown: Array<{ name: string; value: number; count: number }>;
    forecast: {
        forecastedAmount: number;
        confidence: string;
        growthRate: number;
    };
    targetProgress: {
        target: number;
        achieved: number;
        percentage: number;
    };
    upcomingRenewals: Array<{
        id: string;
        policyNumber: string;
        endDate: string;
        amount: number;
        customer: { id: string; name: string } | null;
        customerName: string;
    }>;
}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6366F1'];

export default function Dashboard() {
    const [data, setData] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('6');
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [targetAmount, setTargetAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canSetTarget = user.role === 'ADMIN' || user.role === 'MANAGER';

    const fetchStats = async (selectedRange = range) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/dashboard/stats?range=${selectedRange}&v=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            // Unhandled
        } finally {
            setLoading(false);
        }
    };

    const handleSetTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/dashboard/targets', {
                amount: parseFloat(targetAmount),
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                branchId: user.branchId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsTargetModalOpen(false);
            setTargetAmount('');
            fetchStats();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Hedef belirlenirken bir hata oluştu.';
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchStats(range);
    }, [range]);

    useEffect(() => {
        const handleRefresh = () => fetchStats(range);
        window.addEventListener('refresh-dashboard', handleRefresh);
        return () => window.removeEventListener('refresh-dashboard', handleRefresh);
    }, [range]);

    const MetricCard = ({ title, value, icon: Icon, trend, color, prefix = '' }: any) => (
        <div className="custom-card p-6 border-none">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
                <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                        {loading ? '...' : `${prefix}${value?.toLocaleString() || '0'}`}
                    </h3>
                    <div className={`flex items-center gap-1 mt-2 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold text-xs`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>%{Math.abs(trend)}</span>
                        <span className="text-muted-foreground font-medium ml-1">geçen aya göre</span>
                    </div>
                </div>
                <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.chartData?.slice(-4) || []}>
                            <Line type="monotone" dataKey="income" stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Aktif Poliçeler"
                    value={data?.cards.activePolicies}
                    icon={FileText}
                    trend={12}
                    color="#10B981"
                />
                <MetricCard
                    title="Toplam Satış Kapasitesi"
                    value={data?.cards.totalSales}
                    prefix="₺"
                    icon={TrendingUp}
                    trend={8}
                    color="#3B82F6"
                />
                <MetricCard
                    title="İptal Kayıpları"
                    value={data?.cards.cancellationLoss}
                    prefix="₺"
                    icon={ArrowDownRight}
                    trend={-5}
                    color="#EF4444"
                />
                <MetricCard
                    title="Toplam Komisyon"
                    value={data?.cards.totalCommission}
                    prefix="₺"
                    icon={RefreshCw}
                    trend={20}
                    color="#8B5CF6"
                />
            </div>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="custom-card p-6 border-none bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-indigo-500 text-white">
                            <TrendingUp size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">AI Gelecek Ay Tahmini</h4>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-black text-indigo-600 tracking-tight">
                                ₺{data?.forecast?.forecastedAmount.toLocaleString() || '0'}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                Güven Skoru: <span className="text-indigo-500">{data?.forecast?.confidence === 'HIGH' ? 'Yüksek' : 'Orta'}</span>
                            </p>
                        </div>
                        <div className={`px-2 py-1 rounded-md ${(data?.forecast?.growthRate || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'} text-xs font-black`}>
                            {(data?.forecast?.growthRate || 0) >= 0 ? '+' : ''}{data?.forecast?.growthRate || 0}%
                        </div>
                    </div>
                </div>

                <div className="custom-card p-6 border-none bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-amber-500 text-white">
                            <ShieldAlert size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">Aylık Hedef Durumu</h4>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-muted-foreground">₺{data?.targetProgress?.achieved.toLocaleString()} / ₺{data?.targetProgress?.target.toLocaleString()}</span>
                            {canSetTarget && (
                                <button
                                    onClick={() => setIsTargetModalOpen(true)}
                                    className="text-[10px] font-black text-amber-600 hover:text-amber-700 underline underline-offset-2"
                                >
                                    HEDEF BELİRLE
                                </button>
                            )}
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, data?.targetProgress?.percentage || 0)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="custom-card p-6 border-none bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-500 text-white">
                            <FileText size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">Verimlilik Skoru</h4>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-3xl font-black text-emerald-600 select-none">A+</div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase leading-tight">
                            Satış/Teklif oranı geçen aya göre <span className="text-emerald-500 font-bold">%15 arttı.</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Cash Flow Chart */}
                <div className="custom-card p-8 border-none lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Gelir & Kayıp Analizi</h3>
                                <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">Aktif Satış vs İptal Kayıpları</p>
                            </div>
                            <div className="flex bg-muted p-1 rounded-2xl border border-border">
                                {[
                                    { label: '1 Ay', value: '1' },
                                    { label: '3 Ay', value: '3' },
                                    { label: '6 Ay', value: '6' },
                                    { label: '1 Yıl', value: '12' }
                                ].map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => setRange(p.value)}
                                        className={`px-4 py-2 text-[10px] font-bold rounded-xl transition-all ${range === p.value ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-xs font-medium text-muted-foreground">Net Gelir</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-xs font-medium text-muted-foreground">İptal Zararı</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.chartData || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    dy={10}
                                    interval={0}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderRadius: '12px',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                />
                                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={4} dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cancellation Reasons Breakdown */}
                <div className="custom-card p-8 border-none flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-foreground">İptal Dağılımı</h3>
                        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">Nedene Bağlı Kayıp Oranları</p>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-extrabold text-foreground">₺{(data?.cards.cancellationLoss || 0).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Toplam Kayıp</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.cancellationBreakdown?.length ? data.cancellationBreakdown : [{ name: 'Veri Yok', value: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {(data?.cancellationBreakdown?.length ? data.cancellationBreakdown : [{ name: 'N/A' }]).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={data?.cancellationBreakdown?.length ? COLORS[index % COLORS.length] : 'hsl(var(--muted))'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-auto pt-8">
                        {(data?.cancellationBreakdown || []).slice(0, 4).map((item, i) => (
                            <div key={i} className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-foreground pl-4">%{((item.value / (data?.cards.cancellationLoss || 1)) * 100).toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Smart Renewal Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-3 custom-card p-8 border-none overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Yaklaşan Yenilemeler</h3>
                                <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">Önümüzdeki 30 Gün İçinde Bitiş Bekleyen Poliçeler</p>
                            </div>
                        </div>
                        <Link to="/sales" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                            Tümünü Gör
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto -mx-8 px-8">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Müşteri & Poliçe</th>
                                    <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Bitiş Tarihi</th>
                                    <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(!data?.upcomingRenewals || data.upcomingRenewals.length === 0) ? (
                                    <tr><td colSpan={3} className="p-10 text-center text-muted-foreground text-sm italic font-medium">Yakın zamanda yenilenecek poliçe bulunmuyor.</td></tr>
                                ) : data.upcomingRenewals.map((renewal) => {
                                    const daysLeft = Math.ceil((new Date(renewal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <tr key={renewal.id} className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground group-hover:text-amber-600 transition-colors">{renewal.customer?.name || renewal.customerName}</span>
                                                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">{renewal.policyNumber || 'No Yok'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-bold text-foreground/80">{new Date(renewal.endDate).toLocaleDateString('tr-TR')}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter mt-0.5 ${daysLeft <= 7 ? 'text-red-500' : 'text-amber-500'}`}>
                                                        {daysLeft} GÜN KALDI
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => window.location.href = `/customers/${renewal.customer?.id || ''}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground rounded-lg text-[10px] font-bold transition-all"
                                                >
                                                    Müşteri Dosyası
                                                    <ChevronRight size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] p-8 text-white flex flex-col justify-between shadow-xl shadow-amber-500/10">
                    <div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Yenileme Fırsatı</h3>
                        <p className="text-amber-50/80 text-sm font-medium leading-relaxed">Bu ay yenilenmesi gereken <span className="text-white font-bold">{data?.upcomingRenewals?.length || 0}</span> poliçe sizi bekliyor. Toplam prim potansiyelini değerlendirin.</p>
                    </div>

                    <div className="pt-8">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                            <span>Aylık Hedef Gerçekleşme</span>
                            <span>%{data?.targetProgress?.percentage || 0}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full shadow-sm transition-all duration-1000"
                                style={{ width: `${Math.min(100, data?.targetProgress?.percentage || 0)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Tips */}
            <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-600/10">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <TrendingUp size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-3 italic">Satışlarınızı %25 Artırmak İster Misiniz?</h3>
                        <p className="text-emerald-50/80 leading-relaxed font-medium">Potansiyel müşterilerinize otomatik hatırlatıcılar kurarak dönüşüm oranlarını artırın. Görevler sayfasından ilk adımı atabilirsiniz.</p>
                    </div>
                    <button className="whitespace-nowrap bg-white text-emerald-700 px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-900/10">
                        Aksiyon Al
                    </button>
                </div>
            </div>

            {/* Target Modal */}
            {isTargetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-foreground mb-2">Aylık Hedef Belirle</h3>
                        <p className="text-sm text-muted-foreground font-medium mb-6">
                            {new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} dönemi için
                            şube satış hedefini belirleyin.
                        </p>
                        <form onSubmit={handleSetTarget}>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Hedef Tutar (₺)</label>
                                    <input
                                        autoFocus
                                        type="number"
                                        required
                                        value={targetAmount}
                                        onChange={(e) => setTargetAmount(e.target.value)}
                                        className="w-full bg-muted border-none rounded-2xl px-5 py-4 text-lg font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                                        placeholder="Örn: 500000"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTargetModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="flex-1 bg-amber-500 text-white px-6 py-4 rounded-2xl font-extrabold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Kaydediliyor...' : 'Hedefi Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
