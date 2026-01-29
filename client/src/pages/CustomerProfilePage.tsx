import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Users,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    ShieldCheck,
    CreditCard,
    AlertCircle,
    ArrowLeft,
    TrendingUp,
    Download,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerProfile {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    identityNumber: string | null;
    address: string | null;
    notes: string | null;
    loyaltyScore: number;
    sales: any[];
    tasks: any[];
    documents: any[];
    _count: {
        sales: number;
        tasks: number;
        documents: number;
    }
}

export default function CustomerProfilePage() {
    const { id } = useParams<{ id: string }>();
    const [customer, setCustomer] = useState<CustomerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/customers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomer(res.data);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const totalPortfolioValue = useMemo(() => {
        return customer?.sales.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
    }, [customer]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-16 h-16 border-4 border-emerald-100/20 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-bold text-muted-foreground">Profil Yükleniyor...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <h2 className="text-2xl font-bold">Müşteri Bulunamadı</h2>
                <Button variant="link" onClick={() => window.history.back()}>Geri Dön</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="p-3 bg-card border border-border rounded-2xl text-muted-foreground hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Müşteri 360 Görünümü</h1>
                    <p className="text-sm text-muted-foreground font-medium">Bütünsel müşteri verileri ve ilişki yönetimi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Profile Summary Card */}
                    <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 -z-0"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200 mb-6">
                                <Users size={40} />
                            </div>

                            <h2 className="text-2xl font-black text-foreground mb-1 uppercase tracking-tight">{customer.name}</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Müşteri No: #{customer.id.slice(0, 8)}</p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telefon</p>
                                        <p className="text-sm font-bold text-foreground">{customer.phone || 'Belirtilmemiş'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-teal-600 shadow-sm">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">E-Posta</p>
                                        <p className="text-sm font-bold text-foreground">{customer.email || 'Belirtilmemiş'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Adres</p>
                                        <p className="text-sm font-bold text-foreground leading-snug">{customer.address || 'Belirtilmemiş'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loyalty & Value Card */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-500/10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold">Müşteri Sadakati</h3>
                            <ShieldCheck size={24} className="opacity-80" />
                        </div>

                        <div className="flex flex-col items-center justify-center mb-8">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle
                                        cx="64" cy="64" r="58"
                                        fill="transparent"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="64" cy="64" r="58"
                                        fill="transparent"
                                        stroke="white"
                                        strokeWidth="8"
                                        strokeDasharray={364}
                                        strokeDashoffset={364 - (364 * customer.loyaltyScore) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black">{customer.loyaltyScore}</span>
                                    <span className="text-[10px] font-bold opacity-60 uppercase">Puan</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} />
                                    <span className="text-xs font-bold">Portföy Değeri</span>
                                </div>
                                <span className="font-black text-lg">₺{totalPortfolioValue.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    <span className="text-xs font-bold">Poliçe Sayısı</span>
                                </div>
                                <span className="font-black text-lg">{customer._count.sales}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Dynamic Tabs / Data Sections */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Sales History */}
                    <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Poliçe ve Satış Geçmişi</h3>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">{customer.sales.length} Kayıt</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Poliçe Bigileri</th>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tutar</th>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Bitiş Tarihi</th>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {customer.sales.length === 0 ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-medium italic">Henüz poliçe/satış kaydı bulunmuyor.</td></tr>
                                    ) : customer.sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">{sale.policyType?.name || 'Belirtilmemiş'}</span>
                                                    <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{sale.policyNumber || 'No Yok'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-black text-foreground">₺{Number(sale.amount).toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-muted-foreground" />
                                                    <span className={`text-sm font-bold ${new Date(sale.endDate) < new Date() ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                        {sale.endDate ? new Date(sale.endDate).toLocaleDateString('tr-TR') : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sale.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                                                    sale.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600' :
                                                        'bg-yellow-500/10 text-yellow-600'
                                                    }`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pending Tasks & Documents Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Tasks */}
                        <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-blue-600" />
                                    <h3 className="font-bold text-foreground">Yaklaşan Görevler</h3>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-500/10">Tümü</Button>
                            </div>
                            <div className="p-4 space-y-3">
                                {customer.tasks.length === 0 ? (
                                    <p className="p-6 text-center text-xs text-muted-foreground italic">Planlanmış görev bulunmuyor.</p>
                                ) : customer.tasks.map(task => (
                                    <div key={task.id} className="p-4 bg-muted/50 rounded-2xl flex items-start gap-3 group hover:bg-emerald-500/5 transition-all border border-transparent hover:border-emerald-100/20">
                                        <div className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-emerald-500' : 'text-orange-500'}`}>
                                            {task.isCompleted ? <CheckCircle2 size={16} /> : <div className="h-4 w-4 rounded-full border-2 border-orange-500 animate-pulse" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${task.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground mt-1">{new Date(task.dueDate).toLocaleDateString('tr-TR')} • {task.priority}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-indigo-600" />
                                    <h3 className="font-bold text-foreground">Önemli Belgeler</h3>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10">Yönet</Button>
                            </div>
                            <div className="p-4 space-y-3">
                                {customer.documents.length === 0 ? (
                                    <p className="p-6 text-center text-xs text-muted-foreground italic">Yüklenmiş belge bulunmuyor.</p>
                                ) : customer.documents.map(doc => (
                                    <div key={doc.id} className="p-4 bg-muted/50 rounded-2xl border border-transparent hover:border-indigo-100/20 hover:bg-indigo-500/5 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground group-hover:text-indigo-600 shadow-sm transition-colors">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{doc.filename}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{Math.round(doc.size / 1024)} KB</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-card rounded-lg text-muted-foreground hover:text-indigo-600 transition-all">
                                                <Download size={14} />
                                            </button>
                                            <button className="p-1.5 hover:bg-card rounded-lg text-muted-foreground hover:text-indigo-600 transition-all">
                                                <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
