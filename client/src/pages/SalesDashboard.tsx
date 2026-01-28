import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FileText,
    ArrowUpRight,
    TrendingUp,
    RefreshCw,
    CheckCircle2,
    Target,
    Plus
} from 'lucide-react';
import CreateSaleModal from '../components/CreateSaleModal';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

interface Stats {
    cards: {
        totalSales: number;
        activePolicies: number;
        newLeads: number;
        totalCommission: number;
    };
    chartData: Array<{ name: string; income: number }>;
}

export default function SalesDashboard() {
    const [data, setData] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('6');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchStats = async (selectedRange = range) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/dashboard/stats?range=${selectedRange}&v=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
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
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</span>
                <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400">
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {loading ? '...' : `${prefix}${value?.toLocaleString() || '0'}`}
                    </h3>
                    <div className={`flex items-center gap-1 mt-2 text-emerald-600 font-bold text-xs`}>
                        <ArrowUpRight size={14} />
                        <span>%{trend}</span>
                        <span className="text-gray-400 font-medium ml-1">geçen aya göre</span>
                    </div>
                </div>
                <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.chartData?.slice(-4) || []}>
                            <Area type="monotone" dataKey="income" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-gray-900">Satış Analizi</h2>
                    <p className="text-sm text-gray-500 font-medium">Gelir ve poliçe üretim detayları</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        {[
                            { label: '1 Ay', value: '1' },
                            { label: '3 Ay', value: '3' },
                            { label: '6 Ay', value: '6' },
                            { label: '1 Yıl', value: '12' }
                        ].map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setRange(p.value)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${range === p.value ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Yeni Satış Kaydı
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Aktif Poliçeler"
                    value={data?.cards.activePolicies}
                    icon={FileText}
                    trend={12}
                    color="#10B981"
                />
                <MetricCard
                    title="Bürüt Satış"
                    value={data?.cards.totalSales}
                    prefix="₺"
                    icon={TrendingUp}
                    trend={8}
                    color="#3B82F6"
                />
                <MetricCard
                    title="Potansiyel (Leads)"
                    value={data?.cards.newLeads}
                    icon={Target}
                    trend={5}
                    color="#F59E0B"
                />
                <MetricCard
                    title="Tahakkuk Eden Komisyon"
                    value={data?.cards.totalCommission}
                    prefix="₺"
                    icon={RefreshCw}
                    trend={20}
                    color="#8B5CF6"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="custom-card p-8 border-none lg:col-span-2">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Satış Performansı</h3>
                        <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Aylık Brüt Gelir Dağılımı</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.chartData || []}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="custom-card p-6 border-none bg-emerald-600 text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-white/10">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold">Satış Hedefi</h4>
                                <p className="text-xs text-white/70">Aylık hedefinizin %85'ine ulaştınız.</p>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                            <div className="h-full bg-white w-[85%]" />
                        </div>
                        <button className="w-full py-3 rounded-xl bg-white text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all">
                            Detaylı Rapor
                        </button>
                    </div>

                    <div className="custom-card p-6 border-none h-fit">
                        <h4 className="font-bold text-gray-900 mb-4">Verimlilik İpucu</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Poliçe yenileme tarihlerinden 30 gün önce müşterilerinizle iletişime geçmek, portföy tutma oranınızı %15'e kadar artırabilir.
                        </p>
                    </div>
                </div>
            </div>

            <CreateSaleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchStats}
            />
        </div>
    );
}
