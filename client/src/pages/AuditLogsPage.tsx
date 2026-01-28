import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    History,
    Filter,
    User as UserIcon,
    Activity,
    Database,
    ChevronLeft,
    ChevronRight,
    Info,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    user: {
        name: string;
        role: string;
        email: string;
    };
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        userId: ''
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...filters
            });

            const res = await axios.get(`/api/audit?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setLogs(res.data.logs);
            setTotalPages(res.data.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const baseClasses = "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit";
        switch (action) {
            case 'CREATE':
                return <span className={`${baseClasses} bg-emerald-50 text-emerald-700`}><CheckCircle2 size={12} /> Ekleme</span>;
            case 'UPDATE':
                return <span className={`${baseClasses} bg-blue-50 text-blue-700`}><Activity size={12} /> Güncelleme</span>;
            case 'DELETE':
                return <span className={`${baseClasses} bg-red-50 text-red-700`}><AlertCircle size={12} /> Silme</span>;
            case 'LOGIN':
                return <span className={`${baseClasses} bg-purple-50 text-purple-700`}><UserIcon size={12} /> Giriş</span>;
            case 'EXPORT':
                return <span className={`${baseClasses} bg-amber-50 text-amber-700`}><Database size={12} /> Dışa Aktar</span>;
            default:
                return <span className={`${baseClasses} bg-gray-50 text-gray-700`}>{action}</span>;
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sistem Günlükleri</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Uygulama üzerindeki tüm kritik işlemlerin denetim kaydı</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchLogs()}
                        className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all"
                    >
                        <History size={18} className="text-gray-500" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-xl text-white shadow-lg shadow-gray-200">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-bold">Güvenli Kayıt</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Filter className="absolute left-4 top-1/2 -track-y-1/2 text-gray-400" size={16} />
                    <select
                        value={filters.action}
                        onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">Tüm İşlemler</option>
                        <option value="CREATE">Ekleme</option>
                        <option value="UPDATE">Güncelleme</option>
                        <option value="DELETE">Silme</option>
                        <option value="LOGIN">Giriş</option>
                        <option value="EXPORT">Dışa Aktarma</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[200px] relative">
                    <Database className="absolute left-4 top-1/2 -track-y-1/2 text-gray-400" size={16} />
                    <select
                        value={filters.resource}
                        onChange={(e) => setFilters(f => ({ ...f, resource: e.target.value }))}
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">Tüm Modüller</option>
                        <option value="Sale">Satışlar</option>
                        <option value="User">Personel</option>
                        <option value="Branch">Şubeler</option>
                        <option value="PolicyType">Branşlar</option>
                        <option value="Auth">Yetkilendirme</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Zaman</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kullanıcı</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlem</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modül</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Detay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6 h-16 bg-gray-50/20"></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                                                <History size={32} />
                                            </div>
                                            <p className="text-gray-400 font-bold">Kayıt bulunamadı</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-gray-900">
                                                {format(new Date(log.createdAt), 'dd MMMM yyyy', { locale: tr })}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {format(new Date(log.createdAt), 'HH:mm:ss')}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <UserIcon size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{log.user?.name || 'Sistem'}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium lowercase italic">{log.user?.role || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-gray-700">{log.resource}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                            >
                                                <Info size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-5 bg-gray-50/30 flex items-center justify-between border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Sayfa <span className="text-gray-900">{page}</span> / {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 bg-white rounded-lg border border-gray-100 disabled:opacity-30 shadow-sm"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-white rounded-lg border border-gray-100 disabled:opacity-30 shadow-sm"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl p-8 space-y-8 animate-in zoom-in duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <History size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">İşlem Detayları</h2>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-3 bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all font-bold"
                            >
                                Kapat
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-6 rounded-3xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">IP ADRESİ</p>
                                <p className="text-sm font-bold text-gray-900">{selectedLog.ipAddress || 'Bilinmiyor'}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-3xl">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">RESOURCE ID</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{selectedLog.resourceId || '-'}</p>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-8 rounded-[32px] overflow-hidden">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">HAM VERİ (DETAILS)</p>
                            <pre className="text-emerald-400 font-mono text-xs overflow-x-auto">
                                {JSON.stringify(selectedLog.details, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const ShieldCheck = ({ size }: { size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);
