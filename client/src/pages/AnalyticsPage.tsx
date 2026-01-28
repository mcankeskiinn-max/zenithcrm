import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell
} from 'recharts';
import { TrendingUp, Activity, Building2, Calendar, Target, Download } from 'lucide-react';

export default function AnalyticsPage() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [branchData, setBranchData] = useState([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role);
        fetchMonthly();
        if (user.role === 'SUPER_ADMIN') {
            fetchBranchStats();
        }
    }, []);

    const fetchMonthly = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/analytics/monthly', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMonthlyData(res.data);
        } catch (error) {
            console.error('Failed to fetch monthly stats', error);
        }
    };

    const fetchBranchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/analytics/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranchData(res.data);
        } catch (error) {
            console.error('Failed to fetch branch stats', error);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/reports/export/sales?startDate=${startDate}&endDate=${endDate}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Satis_Raporu_${startDate}_${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed', error);
            alert('Rapor indirilirken bir hata oluştu');
        } finally {
            setIsExporting(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-bold text-gray-900">
                        {payload[0].name}: <span className="text-emerald-600">
                            {typeof payload[0].value === 'number' ?
                                (payload[0].name.includes('Tutarı') ? `₺${payload[0].value.toLocaleString()}` : payload[0].value)
                                : payload[0].value}
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Performans Analizi</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Veri odaklı büyüme ve strateji geliştirme</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0"
                        />
                        <span className="text-gray-300">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0"
                        />
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-md shadow-gray-200 disabled:opacity-50"
                    >
                        <Download size={18} className={isExporting ? 'animate-bounce' : ''} />
                        <span className="text-sm font-bold">{isExporting ? 'Hazırlanıyor...' : 'Excel Raporu Al'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Volume */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Satış Hacmi</h3>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Son 6 Ay</span>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    tickFormatter={(value: number) => `₺${value / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="total" name="Satış Tutarı" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales Count Trend */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Satış Adedi</h3>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trend Analizi</span>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Satış Sayısı"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Branch comparison (Admin Only) */}
                {userRole === 'SUPER_ADMIN' && (
                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Building2 size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Şube Performans Ligi</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                    <Target size={12} />
                                    HEDEF %85
                                </div>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 800, fill: '#1e293b' }}
                                        width={140}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="salesCount" name="Aktif Satış Sayısı" radius={[0, 6, 6, 0]} barSize={24}>
                                        {branchData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
