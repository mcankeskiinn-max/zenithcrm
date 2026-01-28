import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, ShieldCheck, Search, MoreHorizontal, Hash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PolicyType {
    id: string;
    name: string;
}

export default function PolicyTypesPage() {
    const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTypeName, setNewTypeName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingType, setEditingType] = useState<PolicyType | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchPolicyTypes();
    }, []);

    const fetchPolicyTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/policy-types', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPolicyTypes(res.data);
        } catch (error) {
            console.error('Failed to fetch policy types', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/policy-types', {
                name: newTypeName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewTypeName('');
            fetchPolicyTypes();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Branş oluşturulamadı');
        }
    };

    const handleEdit = (type: PolicyType) => {
        setEditingType(type);
        setEditName(type.name);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingType) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/policy-types/${editingType.id}`, {
                name: editName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            setEditingType(null);
            fetchPolicyTypes();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Branş güncellenemedi');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu branşı silmek istediğinizden emin misiniz?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/policy-types/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPolicyTypes();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Branş silinemedi');
        }
    };

    const filteredTypes = policyTypes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Poliçe Branşları</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Sistemdeki tüm branş kategorilerini yönetin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Form */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Yeni Branş</h3>
                                <p className="text-xs text-gray-400 font-medium tracking-wide">Yeni bir kategori ekleyin</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Branş Adı</label>
                                <Input
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    placeholder="Örn: Kasko, Sağlık, Konut"
                                    className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 mt-2">
                                Branşı Oluştur
                            </Button>
                        </form>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl">
                        <ShieldCheck size={120} className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none" />
                        <h4 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-1">Toplam Branş</h4>
                        <p className="text-4xl font-extrabold">{policyTypes.length}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 w-fit px-3 py-1.5 rounded-full border border-emerald-400/20">
                            Güvenli Veritabanı
                        </div>
                    </div>
                </div>

                {/* Right: List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search bar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Branş adına göre ara..."
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none text-sm text-gray-700 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-full py-20 text-center animate-pulse text-gray-400 font-bold">Yükleniyor...</div>
                        ) : filteredTypes.length === 0 ? (
                            <div className="col-span-full bg-white p-20 rounded-[32px] border border-dashed border-gray-200 text-center">
                                <ShieldCheck size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold">Branş bulunamadı.</p>
                            </div>
                        ) : filteredTypes.map((type) => (
                            <div key={type.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                            <Hash size={20} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 leading-tight">{type.name}</h4>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(type.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-4 relative z-10">
                                    <button
                                        onClick={() => handleEdit(type)}
                                        className="hover:text-emerald-500 transition-colors"
                                    >
                                        Düzenle
                                    </button>
                                    <span className="text-gray-300 group-hover:text-emerald-500 transition-colors">Detaylar &rarr;</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Hash size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Branş Düzenle</h3>
                                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Kategori Adını Güncelle</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Branş Adı</label>
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 h-12 border-none bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl"
                                    >
                                        Vazgeç
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
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
