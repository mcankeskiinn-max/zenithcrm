import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';
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
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import { TrendingUp, Building2, Calendar, Download, Users, PieChart as PieIcon, ArrowUpRight, Trophy } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsPage() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [branchData, setBranchData] = useState([]);
    const [policyDistribution, setPolicyDistribution] = useState([]);
    const [employeePerformance, setEmployeePerformance] = useState([]);
    const [targetProgress, setTargetProgress] = useState<any>(null);
    const [yearlyData, setYearlyData] = useState([]);
    const [isSingleBranch, setIsSingleBranch] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
const headers = { };
            const params = { startDate, endDate };

            const [monthly, branches, distribution, performance, targets, yearly] = await Promise.all([
                axios.get('/api/analytics/monthly', { headers, params }),
                axios.get('/api/analytics/branches', { headers, params }),
                axios.get('/api/analytics/policy-distribution', { headers, params }),
                axios.get('/api/analytics/performance', { headers, params }),
                axios.get('/api/analytics/targets', { headers }),
                axios.get('/api/analytics/yearly', { headers })
            ]);

            setMonthlyData(monthly.data);
            setBranchData(branches.data);
            setPolicyDistribution(distribution.data);
            setEmployeePerformance(performance.data);
            setTargetProgress(targets.data);
            setYearlyData(yearly.data);
        } catch (error) {
            console.error('Failed to fetch analytics data', error);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role);
        setIsSingleBranch(!!user.tenant?.isSingleBranch);
        fetchData();
    }, [fetchData]);

    const handleExport = async () => {
        try {
            setIsExporting(true);
const response = await axios.get(`/api/reports/export/sales?startDate=${startDate}&endDate=${endDate}`, {
                responseType: 'blob'
            });

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
                <div className="bg-card/95 backdrop-blur-md p-4 rounded-2xl border border-border shadow-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                            {p.name}: <span className="text-emerald-600">
                                {typeof p.value === 'number' ?
                                    (p.name.includes('Tutarı') || p.name.includes('Ciro') ? `₺${p.value.toLocaleString()}` : p.value)
                                    : p.value}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Performans Analizi</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1 uppercase tracking-tighter">İş Zekası & Stratejik Görünüm</p>
                </div>
                {isLoading && (
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Veri y?kleniyor...
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                    {/* Target Progress Quick View */}
                    {targetProgress && (
                        <div className="hidden md:flex flex-col gap-1 px-4 py-2 bg-emerald-50/50 rounded-2xl border border-emerald-100 min-w-[200px]">
                            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-700">
                                <span className="uppercase">Aylık Hedef</span>
                                <span>%{targetProgress.percent}</span>
                            </div>
                            <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(targetProgress.percent, 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-[9px] font-medium text-emerald-600 mt-1">
                                ₺{targetProgress.actual.toLocaleString()} / ₺{targetProgress.target.toLocaleString()}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl border border-border shadow-sm">
                        <Calendar size={14} className="text-muted-foreground" />
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
                        <span className="text-sm font-bold">{isExporting ? 'Hazırlanıyor' : 'Excel Al'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                {/* Monthly Volume */}
                <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Satış Hacmi</h3>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aylık Ciro</span>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(value) => `₺${value / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="total" name="Ciro" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Policy Distribution */}
                <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <PieIcon size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Branş Dağılımı</h3>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Portföy Yapısı</span>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={policyDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                    nameKey="name"
                                >
                                    {policyDistribution.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Employee Leaderboard / Personnel Analytics */}
                <div className={cn("bg-card p-8 rounded-[40px] border border-border shadow-sm group", isSingleBranch && "2xl:col-span-1")}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <Trophy size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">
                                {isSingleBranch ? 'Personel Performans Analizi' : 'En İyiler Ligi'}
                            </h3>
                        </div>
                        <Users size={16} className="text-muted-foreground" />
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {employeePerformance.map((emp: any, index: number) => (
                            <div key={emp.name} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                                        index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{emp.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase">{emp.count} Sigorta</p>
                                            {isSingleBranch && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold uppercase tracking-tighter">
                                                    Aktif
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600">₺{emp.total.toLocaleString()}</p>
                                    <div className="flex items-center gap-1 justify-end text-[9px] text-muted-foreground">
                                        <ArrowUpRight size={10} />
                                        PERFORMANS
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Single Branch: Yearly Growth Trend */}
                {isSingleBranch && (
                    <div className="lg:col-span-2 2xl:col-span-3 bg-card p-8 rounded-[40px] border border-border shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Yıllık Gelişim Trendi</h3>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date().getFullYear()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date().getFullYear() - 1}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={yearlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(value) => `₺${value / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="currentYear" name="Bu Yıl" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="lastYear" name="Geçen Yıl" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Multi Branch: Branch comparison (Admin Only) */}
                {!isSingleBranch && userRole !== 'EMPLOYEE' && (
                    <div className="lg:col-span-2 2xl:col-span-3 bg-card p-8 rounded-[40px] border border-border shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Building2 size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Şube Karşılaştırması</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase">Global Rapor</div>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={branchData} margin={{ top: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#1e293b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(value) => `₺${value / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="totalAmount" name="Toplam Ciro" radius={[10, 10, 0, 0]} barSize={60}>
                                        {branchData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
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

