import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SalesKanban from '@/components/SalesKanban';
import {
    LayoutList,
    LayoutGrid,
    Plus,
    Trash2,
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    FileText,
    User,
    Building2,
    ChevronDown,
    X,
    Upload
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { DocumentList } from '@/components/DocumentList';

interface Sale {
    id: string;
    policyNumber: string;
    customerName: string;
    amount: number;
    status: string;
    employee?: { id?: string; name: string };
    branch?: { id?: string; name: string };
    policyType?: { id?: string; name: string };
    _count?: { documents: number };
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [customerName, setCustomerName] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [branchId, setBranchId] = useState('');
    const [policyTypeId, setPolicyTypeId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
    const [policyTypes, setPolicyTypes] = useState<{ id: string, name: string }[]>([]);
    const [employees, setEmployees] = useState<{ id: string, name: string, role: string }[]>([]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [status, setStatus] = useState('ACTIVE');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshDocs, setRefreshDocs] = useState(0);
    const [showDocsId, setShowDocsId] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            if (user.branchId) setBranchId(user.branchId);
        }
        fetchSales();
        fetchBranches();
        fetchPolicyTypes();
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (refreshDocs > 0) {
            fetchSales();
        }
    }, [refreshDocs]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
        } catch (error) {
            // Silently fail or handle ui error
        }
    };

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (error) {
            // Silent
        }
    };

    const fetchPolicyTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/policy-types', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPolicyTypes(res.data);
        } catch (error) {
            // Silent
        }
    };

    const fetchSales = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/sales?v=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSales(res.data);
        } catch (error) {
            // Silent
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/sales', {
                customerName,
                policyNumber,
                amount,
                branchId,
                policyTypeId,
                employeeId,
                status: 'LEAD'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            resetForm();
            setShowCreateModal(false);
            fetchSales();
        } catch (error) {
            alert('Satış oluşturulamadı. Lütfen tüm alanları doldurunuz.');
        }
    };

    const resetForm = () => {
        setCustomerName('');
        setPolicyNumber('');
        setAmount('');
        setPolicyTypeId('');
        setEmployeeId('');
        setStatus('ACTIVE');
    };

    const handleEdit = (sale: any) => {
        setEditingId(sale.id);
        setCustomerName(sale.customerName);
        setPolicyNumber(sale.policyNumber);
        setAmount(sale.amount.toString());
        setBranchId(sale.branchId || '');
        setPolicyTypeId(sale.policyTypeId || '');
        setEmployeeId(sale.employeeId || '');
        setStatus(sale.status);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/sales/${editingId}`, {
                customerName,
                policyNumber,
                amount,
                branchId,
                policyTypeId,
                employeeId,
                status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowEditModal(false);
            setEditingId(null);
            resetForm();
            fetchSales();
        } catch (error) {
            alert('Satış güncellenemedi');
        }
    };

    const handleStatusChange = async (saleId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/sales/${saleId}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSales();
        } catch (error) {
            alert('Durum güncellenemedi');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu satışı silmek istediğinizden emin misiniz?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/sales/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSales();
        } catch (error) {
            alert('Satış silinemedi');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'ACTIVE': 'badge-success',
            'LEAD': 'badge-info',
            'OFFER': 'badge-warning',
            'CANCELLED': 'badge-error',
            'LOST': 'badge-error'
        };
        const labels: Record<string, string> = {
            'ACTIVE': 'Aktif',
            'LEAD': 'Aday',
            'OFFER': 'Teklif',
            'CANCELLED': 'İptal',
            'LOST': 'Kaybedildi'
        };
        return <span className={`badge ${styles[status] || 'badge-info'}`}>{labels[status] || status}</span>;
    };

    const filteredSales = Array.isArray(sales) ? sales.filter(s => {
        const cName = s.customerName || '';
        const pNum = s.policyNumber || '';
        return cName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pNum.toLowerCase().includes(searchTerm.toLowerCase());
    }) : [];



    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Poliçeler ve Satışlar</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Müşteri portföyünüzü ve satış sürecinizi yönetin</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-gray-100 p-1 rounded-2xl shadow-sm">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={18} />
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutList size={18} />
                            Liste
                        </button>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2">
                        <Plus size={20} />
                        Yeni Giriş
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Müşteri adı veya poliçe no ile ara..."
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none text-sm text-gray-700 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-all border border-transparent">
                        <Filter size={18} />
                        Filtrele
                        <ChevronDown size={14} />
                    </button>
                    <button className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            {/* Content Display */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[400px] overflow-hidden">
                {viewMode === 'kanban' ? (
                    <div className="h-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96 gap-4">
                                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                                <p className="text-sm font-bold text-gray-400">Yükleniyor...</p>
                            </div>
                        ) : (
                            <SalesKanban
                                sales={filteredSales}
                                onStatusChange={handleStatusChange}
                                onEdit={handleEdit}
                                onShowDocs={setShowDocsId}
                            />
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 bg-gray-50/50">
                                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Müşteri & Poliçe</th>
                                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tutar</th>
                                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Branş</th>
                                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Şube & Personel</th>
                                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Durum</th>
                                    <th className="p-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-gray-400 font-medium italic">Yükleniyor...</td></tr>
                                ) : filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-10 text-center text-gray-400 font-medium italic">
                                            {sales.length === 0 ? 'Hiç kayıt bulunamadı. Veritabanı boş olabilir.' : 'Aramanızla eşleşen kayıt bulunamadı.'}
                                        </td>
                                    </tr>
                                ) : filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 leading-tight">{sale.customerName}</p>
                                                    <p className="text-[11px] text-gray-400 font-medium mt-1">{sale.policyNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="font-bold text-gray-900">₺{sale.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                                {sale.policyType?.name}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                    <Building2 size={12} className="text-gray-400" />
                                                    {sale.branch?.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                                                    <User size={12} className="text-gray-400" />
                                                    {sale.employee?.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {getStatusBadge(sale.status)}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(sale)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setShowDocsId(sale.id)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all relative"
                                                    title="Belgeler"
                                                >
                                                    <FileText size={16} />
                                                    {sale._count && sale._count.documents > 0 && (
                                                        <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                                                            {sale._count.documents}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sale.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Redesigned Modal Layout (Reusable) */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{showCreateModal ? 'Yeni Satış Girişi' : 'Kaydı Düzenle'}</h3>
                                <p className="text-sm text-gray-500 font-medium">Formu eksiksiz doldurduğunuzdan emin olun.</p>
                            </div>
                            <button
                                onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }}
                                className="p-3 bg-white text-gray-400 hover:text-gray-600 rounded-2xl border border-gray-100 shadow-sm transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Müşteri Adı</label>
                                    <Input
                                        placeholder="Ahmet Yılmaz"
                                        className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Poliçe Numarası</label>
                                    <Input
                                        placeholder="POL-2024-001"
                                        className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                        value={policyNumber}
                                        onChange={(e) => setPolicyNumber(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tutar (₺)</label>
                                    <Input
                                        type="number"
                                        className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Poliçe Branşı</label>
                                    <select
                                        className="w-full h-12 bg-gray-50 border-none rounded-xl outline-none px-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                        value={policyTypeId}
                                        onChange={(e) => setPolicyTypeId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seçiniz...</option>
                                        {policyTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Şube</label>
                                    <select
                                        className="w-full h-12 bg-gray-50 border-none rounded-xl outline-none px-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        required
                                    >
                                        <option value="">Şube Seçiniz...</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                {userRole !== 'EMPLOYEE' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Personel</label>
                                        <select
                                            className="w-full h-12 bg-gray-50 border-none rounded-xl outline-none px-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                            value={employeeId}
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                        >
                                            <option value="">Benim Üzerime Al</option>
                                            {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {showEditModal && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Durum</label>
                                        <select
                                            className="w-full h-12 bg-gray-50 border-none rounded-xl outline-none px-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                        >
                                            <option value="ACTIVE">Aktif</option>
                                            <option value="LEAD">Tanışma/Lead</option>
                                            <option value="OFFER">Teklif Verildi</option>
                                            <option value="CANCELLED">İptal</option>
                                            <option value="LOST">Kaybedildi</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Document Upload Section (Only in Edit Mode) */}
                            {showEditModal && editingId && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Upload className="w-5 h-5 text-emerald-600" />
                                        <h4 className="text-lg font-bold text-gray-900">Belgeler & Dosyalar</h4>
                                    </div>
                                    <FileUpload saleId={editingId} onUploadComplete={() => {
                                        setRefreshDocs(prev => prev + 1);
                                    }} />
                                    <DocumentList saleId={editingId} refreshTrigger={refreshDocs} />
                                </div>
                            )}

                            <div className="flex gap-4 pt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 border-gray-100 transition-all"
                                    onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }}
                                >
                                    İptal
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
                                >
                                    {showCreateModal ? 'Kayıt Oluştur' : 'Değişiklikleri Kaydet'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Quick Document View Modal */}
            {showDocsId && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Satış Belgeleri</h3>
                                <p className="text-sm text-gray-500 font-medium">{sales.find(s => s.id === showDocsId)?.customerName}</p>
                            </div>
                            <button
                                onClick={() => setShowDocsId(null)}
                                className="p-3 bg-white text-gray-400 hover:text-gray-600 rounded-2xl border border-gray-100 shadow-sm transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <FileUpload
                                saleId={showDocsId}
                                onUploadComplete={() => setRefreshDocs(prev => prev + 1)}
                            />
                            <div className="pt-4">
                                <DocumentList
                                    saleId={showDocsId}
                                    refreshTrigger={refreshDocs}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
