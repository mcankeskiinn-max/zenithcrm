import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowDownRight,
    TrendingDown,
    TrendingUp,
    ShieldAlert,
    Info,
    History,
    Plus
} from 'lucide-react';
import CreateCancellationModal from '../components/CreateCancellationModal';
import PolicyCancellationModal from '../components/PolicyCancellationModal';
import { Search, Hash, Building, ShieldCheck } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
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
        cancellationLoss: number;
        cancellationCount: number;
    };
    chartData: Array<{ name: string; expenses: number }>;
    cancellationBreakdown: Array<{ name: string; value: number; count: number }>;
}

const COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6366F1'];

export default function CancellationDashboard() {
    const [data, setData] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('6');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New state for policy list
    const [activePolicies, setActivePolicies] = useState<any[]>([]);
    const [policySearch, setPolicySearch] = useState('');
    const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const fetchStats = async (selectedRange = range) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/dashboard/stats?range=${selectedRange}&v=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);

            // Fetch policies for the list (Active and Cancelled)
            const policiesRes = await axios.get(`/api/sales?v=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Sort by status (Active first) then by date
            const sortedPolicies = policiesRes.data.sort((a: any, b: any) => {
                if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
                if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setActivePolicies(sortedPolicies);
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

    const MetricCard = ({ title, value, icon: Icon, color, prefix = '', suffix = '' }: any) => (
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
                        {loading ? '...' : `${prefix}${value?.toLocaleString() || '0'}${suffix}`}
                    </h3>
                    <div className={`flex items-center gap-1 mt-2 text-red-600 font-bold text-xs`}>
                        <TrendingDown size={14} />
                        <span>Kayıp Trendi</span>
                    </div>
                </div>
                <div className="h-12 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.chartData?.slice(-4) || []}>
                            <Area type="monotone" dataKey="expenses" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
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
                    <h2 className="text-2xl font-bold text-gray-900">İptal Analizi</h2>
                    <p className="text-sm text-gray-500 font-medium">Poliçe iptalleri ve nedenleri detaylı raporu</p>
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
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${range === p.value ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Yeni İptal Kaydı
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <MetricCard
                    title="Toplam Kayıp Tutarı"
                    value={data?.cards.cancellationLoss}
                    prefix="₺"
                    icon={ArrowDownRight}
                    color="#EF4444"
                />
                <MetricCard
                    title="İptal Edilen Poliçe"
                    value={data?.cards.cancellationCount}
                    suffix=" Adet"
                    icon={AlertTriangle}
                    color="#F59E0B"
                />
                <MetricCard
                    title="Kayıp Oranı"
                    value={Math.round((data?.cards.cancellationLoss || 0) / (data?.cards.cancellationLoss || 1) * 100)} // Placeholder logic
                    suffix="%"
                    icon={ShieldAlert}
                    color="#8B5CF6"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cancellation Reasons */}
                <div className="custom-card p-8 border-none flex flex-col">
                    <div className="mb-8 text-center">
                        <h3 className="text-xl font-bold text-gray-900">İptal Nedenleri</h3>
                        <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Dağılım Analizi</p>
                    </div>
                    <div className="h-[250px] w-full flex items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-extrabold text-gray-900">₺{(data?.cards.cancellationLoss || 0).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kayıp</span>
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
                                        <Cell key={`cell-${index}`} fill={data?.cancellationBreakdown?.length ? COLORS[index % COLORS.length] : '#f1f5f9'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 mt-8">
                        {(data?.cancellationBreakdown || []).map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-xs font-bold text-gray-700">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-900">₺{item.value?.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400">{item.count} Poliçe</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loss Timeline */}
                <div className="custom-card p-8 border-none lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Kayıp Zaman Çizelgesi</h3>
                            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Aylık İptal Trendi</p>
                        </div>
                        <div className="p-2 rounded-lg bg-red-50 text-red-600">
                            <History size={20} />
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.chartData || []}>
                                <defs>
                                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorLoss)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                        <Info className="text-amber-600 shrink-0" size={20} />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            <span className="font-bold">Dikkat</span>: Son 3 ayda "Ödeme Problemi" kaynaklı iptallerde %20 artış gözlemlendi. Tahsilat süreçlerini gözden geçirmeniz önerilir.
                        </p>
                    </div>
                </div>
            </div>

            {/* Active Policies List for Direct Cancellation */}
            <div className="mt-8">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Poliçe Listesi</h3>
                            <p className="text-sm text-gray-500 font-medium">Aktif ve iptal edilmiş tüm poliçeleri buradan yönetebilirsiniz</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Poliçe no veya müşteri ara..."
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl outline-none text-sm focus:ring-4 focus:ring-red-500/5 transition-all"
                                value={policySearch}
                                onChange={(e) => setPolicySearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-50">
                                    <th className="pb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-2">Poliçe / Müşteri</th>
                                    <th className="pb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Branş / Şube</th>
                                    <th className="pb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tutar</th>
                                    <th className="pb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right pr-2">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {activePolicies
                                    .filter(p =>
                                        p.policyNumber.toLowerCase().includes(policySearch.toLowerCase()) ||
                                        p.customerName.toLowerCase().includes(policySearch.toLowerCase())
                                    )
                                    .slice(0, 10)
                                    .map((policy) => (
                                        <tr key={policy.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-red-500 transition-all shadow-sm">
                                                        <Hash size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-gray-900">{policy.policyNumber}</p>
                                                            {policy.status === 'CANCELLED' && (
                                                                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-tighter border border-red-100 animate-pulse">
                                                                    İptal Edildi
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">{policy.customerName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                        <ShieldCheck size={12} className="text-emerald-500" />
                                                        {policy.policyType?.name}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                                        <Building size={10} />
                                                        {policy.branch?.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className="text-sm font-bold text-gray-900">₺{policy.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="py-4 text-right pr-2">
                                                {policy.status === 'CANCELLED' ? (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Bu iptal işlemini geri almak istediğinize emin misiniz?')) return;
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                await axios.put(`/api/sales/${policy.id}`, {
                                                                    status: 'ACTIVE',
                                                                    cancelReason: null
                                                                }, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                fetchStats();
                                                            } catch (error) {
                                                                console.error('Failed to undo cancellation', error);
                                                                alert('İşlem geri alınamadı.');
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all transform hover:scale-105 flex items-center gap-2 ml-auto"
                                                    >
                                                        <TrendingUp size={14} />
                                                        Geri Al
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPolicy(policy);
                                                            setIsCancelModalOpen(true);
                                                        }}
                                                        className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all transform group-hover:scale-105"
                                                    >
                                                        İptal Et
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {activePolicies.length === 0 && !loading && (
                            <div className="py-12 text-center">
                                <p className="text-gray-400 font-medium">Henüz aktif poliçe bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreateCancellationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchStats}
            />

            <PolicyCancellationModal
                isOpen={isCancelModalOpen}
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setSelectedPolicy(null);
                }}
                policy={selectedPolicy}
                onSuccess={fetchStats}
            />
        </div>
    );
}
