import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Building2, TrendingUp, Search, MoreHorizontal, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Branch {
    id: string;
    name: string;
    settings: {
        commissionRate: number;
    } | string;
}

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [newBranchName, setNewBranchName] = useState('');
    const [defaultRate, setDefaultRate] = useState('0.10');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editRate, setEditRate] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(res.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/branches', {
                name: newBranchName,
                commissionRate: parseFloat(defaultRate)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewBranchName('');
            setDefaultRate('0.10');
            fetchBranches();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Şube oluşturulamadı');
        }
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setEditName(branch.name);
        try {
            const s = typeof branch.settings === 'string' ? JSON.parse(branch.settings) : branch.settings;
            setEditRate(s?.commissionRate?.toString() || '0.10');
        } catch {
            setEditRate('0.10');
        }
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBranch) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/branches/${editingBranch.id}`, {
                name: editName,
                commissionRate: parseFloat(editRate)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            setEditingBranch(null);
            fetchBranches();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Şube güncellenemedi');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/branches/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBranches();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Şube silinemedi');
        }
    };

    const getRateLabel = (settings: any) => {
        try {
            const s = typeof settings === 'string' ? JSON.parse(settings) : settings;
            return `%${(s.commissionRate * 100).toFixed(0)}`;
        } catch {
            return '%0';
        }
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Şube Yönetimi</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Acentelik şubelerini ve varsayılan ayarları yönetin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Stats & Form */}
                <div className="space-y-6">
                    {/* Add Branch Form */}
                    <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Yeni Şube</h3>
                                <p className="text-xs text-muted-foreground font-medium tracking-wide">Sisteme yeni bir şube tanımlayın</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Şube Adı</label>
                                <Input
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    placeholder="Örn: İstanbul Kadıköy Şubesi"
                                    className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Varsayılan Komisyon Oranı</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={defaultRate}
                                        onChange={(e) => setDefaultRate(e.target.value)}
                                        className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all pl-10 text-sm font-bold"
                                        required
                                    />
                                    <TrendingUp size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1 ml-1 text-right">0.10 formatı %10 anlamına gelir.</p>
                            </div>
                            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 mt-2">
                                Şubeyi Oluştur
                            </Button>
                        </form>
                    </div>

                    {/* Quick Stat */}
                    <div className="bg-emerald-600 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl shadow-emerald-500/20">
                        <Building2 size={120} className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none" />
                        <h4 className="text-sm font-bold text-emerald-100 tracking-widest uppercase mb-1">Toplam Şube Sayısı</h4>
                        <p className="text-4xl font-extrabold">{branches.length}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-50 bg-emerald-700/30 w-fit px-3 py-1.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
                            Aktif Çalışıyor
                        </div>
                    </div>
                </div>

                {/* Right: Branch List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search & Actions */}
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Şube adına göre ara..."
                                className="w-full pl-11 pr-4 py-2.5 bg-muted border-none rounded-xl outline-none text-sm text-foreground focus:bg-card focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2.5 bg-muted text-foreground/80 rounded-xl hover:bg-muted/80 transition-all">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center animate-pulse text-muted-foreground font-bold">Yükleniyor...</div>
                        ) : filteredBranches.length === 0 ? (
                            <div className="col-span-full bg-card p-20 rounded-[32px] border border-dashed border-border text-center">
                                <Building2 size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground font-bold">Şube bulunamadı.</p>
                            </div>
                        ) : filteredBranches.map((branch) => (
                            <div key={branch.id} className="bg-card p-6 rounded-[24px] border border-border shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                            <MapPin size={22} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground leading-tight">{branch.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <TrendingUp size={12} className="text-emerald-500" />
                                                <span className="text-[11px] font-bold text-emerald-600">Varsayılan: {getRateLabel(branch.settings)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="p-2 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-t border-border pt-4 relative z-10">
                                    <button
                                        onClick={() => handleEdit(branch)}
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        Ayarları Düzenle
                                    </button>
                                    <span className="text-muted-foreground/30 group-hover:text-emerald-500 transition-colors">Yönet &rarr;</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-md rounded-[32px] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">Şube Düzenle</h3>
                                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Ayarları Güncelleyin</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Şube Adı</label>
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Komisyon Oranı</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editRate}
                                            onChange={(e) => setEditRate(e.target.value)}
                                            className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all pl-10 text-sm font-bold"
                                            required
                                        />
                                        <TrendingUp size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium ml-1">Örn: 0.15 (%15)</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 h-12 border-none bg-muted hover:bg-muted/80 text-foreground/80 font-bold rounded-xl"
                                    >
                                        Vazgeç
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                                    >
                                        Güncelle
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
