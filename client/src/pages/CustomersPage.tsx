import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Search,
    UserPlus,
    Phone,
    Mail,
    Calendar,
    ChevronRight,
    SearchX,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Customer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    identityNumber: string | null;
    naceCode?: string | null;
    createdAt: string;
    _count: {
        sales: number;
        tasks: number;
    }
}

export default function CustomersPage() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        phone: '',
        identityNumber: '',
        naceCode: ''
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [taxPlateFile, setTaxPlateFile] = useState<File | null>(null);
    const [fillingFromTaxPlate, setFillingFromTaxPlate] = useState(false);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('Bu mÃ¼ÅŸteri kaydÄ±nÄ± silmek istediÄŸinize emin misiniz?')) return;

        try {
await axios.delete(`/api/customers/${id}`, {
                
            });
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (error: any) {
            alert(error.response?.data?.error || 'MÃ¼ÅŸteri silinirken bir hata oluÅŸtu.');
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
const res = await axios.get('/api/customers', {
                
            });
            setCustomers(res.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            name: '',
            email: '',
            phone: '',
            identityNumber: '',
            naceCode: ''
        });
        setTaxPlateFile(null);
        setCreateError('');
    };

    const handleTaxPlateAutofill = async () => {
        if (!taxPlateFile) return;
        setFillingFromTaxPlate(true);
        setCreateError('');

        const formData = new FormData();
        formData.append('document', taxPlateFile);

        try {
            const response = await axios.post('/api/ocr/scan-tax-plate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { companyName, taxNumber, naceCode } = response.data?.data || {};
            setCreateForm((prev) => ({
                ...prev,
                name: prev.name || companyName || '',
                identityNumber: prev.identityNumber || taxNumber || '',
                naceCode: naceCode || prev.naceCode || ''
            }));
        } catch (error: any) {
            setCreateError(error.response?.data?.error || 'Vergi levhasindan otomatik doldurma yapilamadi.');
        } finally {
            setFillingFromTaxPlate(false);
        }
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError('');
        try {
            await axios.post('/api/customers', {
                name: createForm.name,
                email: createForm.email || undefined,
                phone: createForm.phone || undefined,
                identityNumber: createForm.identityNumber || undefined,
                naceCode: createForm.naceCode || undefined
            });
            setIsCreateOpen(false);
            resetCreateForm();
            fetchCustomers();
        } catch (error: any) {
            setCreateError(error.response?.data?.error || 'Müşteri oluşturulamadı.');
        } finally {
            setCreating(false);
        }
    };
    const filteredCustomers = customers.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">MÃ¼ÅŸteri PortfÃ¶yÃ¼</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Sistemdeki tÃ¼m mÃ¼ÅŸteriler ve Ã¶zet bilgileri</p>
                </div>

                <Button onClick={() => setIsCreateOpen(true)} className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2">
                    <UserPlus size={20} />
                    Yeni MÃ¼ÅŸteri
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Ä°sim, telefon veya e-posta ile ara..."
                        className="w-full pl-11 pr-4 py-2.5 bg-muted border-none rounded-xl outline-none text-sm text-gray-700 focus:bg-card focus:ring-4 focus:ring-emerald-500/5 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-card p-6 rounded-3xl border border-border shadow-sm animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-100 rounded"></div>
                                    <div className="h-3 w-24 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-10 bg-gray-100 rounded-xl"></div>
                                <div className="h-10 bg-gray-100 rounded-xl"></div>
                            </div>
                        </div>
                    ))
                ) : filteredCustomers.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground bg-card rounded-3xl border border-border border-dashed">
                        <SearchX size={48} className="mb-4 text-gray-200" />
                        <p className="font-bold">MÃ¼ÅŸteri bulunamadÄ±</p>
                        <p className="text-sm">FarklÄ± bir arama terimi deneyin veya yeni bir kayÄ±t oluÅŸturun.</p>
                    </div>
                ) : filteredCustomers.map((customer) => (
                    <div
                        key={customer.id}
                        className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                        onClick={() => navigate(`/app/customers/${customer.id}`)}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{customer.name}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">MÃ¼ÅŸteri ID: {customer.id.slice(0, 8)}</p>
                                    {customer.naceCode && (
                                        <p className="text-[10px] font-bold text-emerald-600 mt-1">NACE: {customer.naceCode}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => handleDelete(e, customer.id)}
                                    className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                                    title="MÃ¼ÅŸteriyi Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 bg-muted rounded-2xl">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">PoliÃ§e SayÄ±sÄ±</p>
                                <p className="text-lg font-black text-foreground">{customer._count.sales}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-2xl">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">AÃ§Ä±k GÃ¶revler</p>
                                <p className="text-lg font-black text-foreground">{customer._count.tasks}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {customer.phone && (
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Phone size={14} className="text-emerald-500" />
                                    {customer.phone}
                                </div>
                            )}
                            {customer.email && (
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Mail size={14} className="text-teal-500" />
                                    {customer.email}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground pt-2">
                                <Calendar size={12} />
                                KayÄ±t: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        {isCreateOpen && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                <div
                    className="bg-card w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                        <div>
                            <h3 className="text-2xl font-bold text-foreground">Yeni Müşteri</h3>
                            <p className="text-sm text-muted-foreground">Hızlı müşteri kaydı oluşturun.</p>
                        </div>
                        <button
                            onClick={() => { setIsCreateOpen(false); resetCreateForm(); }}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Ad Soyad</label>
                            <input
                                className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-medium"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">E-posta</label>
                                <input
                                    type="email"
                                    className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-medium"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Telefon</label>
                                <input
                                    className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-medium"
                                    value={createForm.phone}
                                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">TCKN</label>
                            <input
                                className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-medium"
                                value={createForm.identityNumber}
                                onChange={(e) => setCreateForm({ ...createForm, identityNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">NACE Kodu</label>
                            <input
                                className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-medium"
                                placeholder="Orn: 69.20.01"
                                value={createForm.naceCode}
                                onChange={(e) => setCreateForm({ ...createForm, naceCode: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3 rounded-2xl border border-border p-4 bg-muted/30">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                Vergi Levhasindan Otomatik Doldur
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="w-full text-xs"
                                onChange={(e) => setTaxPlateFile(e.target.files?.[0] || null)}
                            />
                            <Button
                                type="button"
                                onClick={handleTaxPlateAutofill}
                                disabled={!taxPlateFile || fillingFromTaxPlate}
                                className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                                {fillingFromTaxPlate ? 'Levha okunuyor...' : 'Levhadan NACE Doldur'}
                            </Button>
                        </div>

                        {createError && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20">
                                {createError}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12 rounded-2xl font-bold text-muted-foreground hover:bg-muted border-border transition-all"
                                onClick={() => { setIsCreateOpen(false); resetCreateForm(); }}
                            >
                                Vazgeç
                            </Button>
                            <Button
                                type="submit"
                                disabled={creating}
                                className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all"
                            >
                                {creating ? 'Kaydediliyor...' : 'Kaydı Oluştur'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </div>
    );
}















