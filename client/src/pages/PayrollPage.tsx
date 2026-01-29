import React, { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    TrendingUp,
    Users,
    Briefcase,
    Calendar,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface PayrollStats {
    totalSales: number;
    totalAmount: number;
    totalCommission: number;
}

interface PayrollSale {
    id: string;
    date: string;
    customer: string;
    amount: number;
    employee: string;
    branch: string;
    estimatedCommission: number;
}

const PayrollPage: React.FC = () => {
    const [stats, setStats] = useState<PayrollStats | null>(null);
    const [sales, setSales] = useState<PayrollSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const fetchPayrollData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/payroll/summary`, {
                params: { startDate, endDate },
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setSales(res.data.sales);
        } catch (error) {
            console.error('Fetch payroll error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/payroll/export`, {
                params: { startDate, endDate },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bordro_${startDate}_${endDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export PDF error:', error);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        fetchPayrollData();
    }, [startDate, endDate]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bordro ve Finans</h1>
                    <p className="text-gray-500 dark:text-gray-400">Komisyon hak edişlerini ve finansal raporları yönetin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting || loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {exporting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                            <Download size={18} />
                        )}
                        <span>PDF Bordro İndir</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Başlangıç</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bitiş</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>
                <button
                    onClick={fetchPayrollData}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <Search size={20} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Briefcase size={64} className="text-orange-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Satış</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {loading ? '...' : stats?.totalSales}
                    </h3>
                    <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
                        <TrendingUp size={14} className="mr-1" />
                        <span>Dönemlik aktif poliçeler</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users size={64} className="text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Ciro</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {loading ? '...' : `₺${stats?.totalAmount.toLocaleString('tr-TR')}`}
                    </h3>
                    <p className="mt-4 text-xs text-gray-500">Net prim ödemeleri toplamı</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900 relative overflow-hidden group bg-orange-50/30 dark:bg-orange-900/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-orange-600">
                        <FileText size={64} />
                    </div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Hak Edilen Komisyon</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {loading ? '...' : `₺${stats?.totalCommission.toLocaleString('tr-TR')}`}
                    </h3>
                    <p className="mt-4 text-xs text-orange-600/80 font-medium flex items-center">
                        <Download size={12} className="mr-1" /> PDF Bordroyla eşleşir
                    </p>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Dönem Detayları</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Filter size={16} />
                        <span>Onaylı Poliçeler</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Tarih</th>
                                <th className="px-6 py-4">Müşteri</th>
                                <th className="px-6 py-4">Şube / Personel</th>
                                <th className="px-6 py-4">Poliçe Tutarı</th>
                                <th className="px-6 py-4 text-orange-600">Komisyon (Est.)</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8 h-4 bg-gray-50 dark:bg-gray-900/20" />
                                    </tr>
                                ))
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Bu tarihler arasında veri bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {format(new Date(sale.date), 'dd MMM yyyy', { locale: tr })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {sale.customer}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{sale.branch}</div>
                                            <div className="text-xs text-gray-500">{sale.employee}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                            ₺{Number(sale.amount).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-orange-600">
                                            ₺{sale.estimatedCommission.toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayrollPage;
