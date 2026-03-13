// Deployment Version: 2026-01-30-T20-10
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    ExternalLink,
    Edit2,
    Trash2,
    Save,
    X,
    Plus,
    MessageSquare,
    MessageCircle,
    PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeModal } from '@/components/QRCodeModal';

interface CustomerProfile {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    identityNumber: string | null;
    naceCode?: string | null;
    accountSuggestions?: Array<{
        code: string;
        title: string;
        reason: string;
        confidence: 'Yuksek' | 'Orta';
    }>;
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
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<CustomerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        email: '',
        identityNumber: '',
        naceCode: '',
        address: '',
        notes: ''
    });
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'MEDIUM'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchCustomerData();
    }, [id]);

    const fetchCustomerData = async () => {
        try {
const res = await axios.get(`/api/customers/${id}`, {
                
            });
            setCustomer(res.data);
            setEditForm({
                name: res.data.name || '',
                phone: res.data.phone || '',
                email: res.data.email || '',
                identityNumber: res.data.identityNumber || '',
                naceCode: res.data.naceCode || '',
                address: res.data.address || '',
                notes: res.data.notes || ''
            });
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
await axios.patch(`/api/customers/${id}`, editForm, {
                
            });
            fetchCustomerData();
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Profil gÃ¼ncellenirken bir hata oluÅŸtu.');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateTask = async () => {
        setSaving(true);
        try {
await axios.post('/api/tasks', {
                ...taskForm,
                customerId: id
            }, {
                
            });
            setIsTaskModalOpen(false);
            setTaskForm({ title: '', description: '', dueDate: '', priority: 'MEDIUM' });
            fetchCustomerData();
        } catch (error) {
            console.error('Failed to create task', error);
            alert('GÃ¶rev oluÅŸturulurken hata oluÅŸtu.');
        } finally {
            setSaving(false);
        }
    };

    const toggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
        try {
await axios.put(`/api/tasks/${taskId}`, {
                isCompleted: !currentStatus
            }, {
                
            });
            fetchCustomerData();
        } catch (error) {
            console.error('Failed to update task status', error);
            alert('GÃ¶rev gÃ¼ncellenirken hata oluÅŸtu.');
        }
    };

    const handleDeleteCustomer = async () => {
        if (!window.confirm('Bu mÃ¼ÅŸteri kaydÄ±nÄ± silmek istediÄŸinize emin misiniz? Bu iÅŸlem geri alÄ±namaz.')) {
            return;
        }

        try {
await axios.delete(`/api/customers/${id}`, {
                
            });
            navigate('/app/customers');
        } catch (error: any) {
            const msg = error.response?.data?.error || 'MÃ¼ÅŸteri silinirken bir hata oluÅŸtu.';
            alert(msg);
        }
    };

    const handleExportPDF = async () => {
        try {
const response = await axios.get(`/api/reports/export/customer/${id}/pdf`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Musteri_Ozeti_${customer?.name?.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Failed to export PDF', error);
            alert('PDF raporu oluÅŸturulurken bir hata oluÅŸtu.');
        }
    };

    // Communication Helper Functions
    const formatPhoneForWhatsApp = (phone: string | null): string | null => {
        if (!phone) return null;

        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // If starts with 0, remove it and add country code
        if (cleaned.startsWith('0')) {
            return '90' + cleaned.substring(1);
        }

        // If already has country code
        if (cleaned.startsWith('90')) {
            return cleaned;
        }

        // Otherwise add country code
        return '90' + cleaned;
    };

    // Device detection utility
    const isMobileDevice = () => {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    };

    const handleWhatsAppClick = () => {
        const formattedPhone = formatPhoneForWhatsApp(customer?.phone || null);
        if (formattedPhone) {
            if (isMobileDevice()) {
                // On mobile, open WhatsApp app directly
                window.location.href = `whatsapp://send?phone=${formattedPhone}`;
            } else {
                // On desktop, open WhatsApp Web
                window.open(`https://wa.me/${formattedPhone}`, '_blank');
            }
        }
    };

    const handleSMSClick = () => {
        if (customer?.phone) {
            window.open(`sms:${customer.phone}`, '_blank');
        }
    };

    const handleCallClick = () => {
        if (customer?.phone) {
            window.location.href = `tel:${customer.phone}`;
        }
    };


    const totalPortfolioValue = useMemo(() => {
        if (!customer?.sales) return 0;
        return customer.sales.reduce((sum, s) => {
            const amt = s?.amount ? Number(s.amount) : 0;
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }, [customer]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-16 h-16 border-4 border-emerald-100/20 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-bold text-muted-foreground">Profil YÃ¼kleniyor...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <h2 className="text-2xl font-bold">MÃ¼ÅŸteri BulunamadÄ±</h2>
                <Button variant="link" onClick={() => window.history.back()}>Geri DÃ¶n</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/customers')}
                        className="p-3 bg-card border border-border rounded-2xl text-muted-foreground hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">MÃ¼ÅŸteri 360 GÃ¶rÃ¼nÃ¼mÃ¼</h1>
                        <p className="text-sm text-muted-foreground font-medium">BÃ¼tÃ¼nsel mÃ¼ÅŸteri verileri ve iliÅŸki yÃ¶netimi</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleDeleteCustomer}
                        className="h-11 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-2xl transition-all gap-2 px-6"
                    >
                        <Trash2 size={18} />
                        Sil
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleExportPDF}
                        className="h-11 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-2xl transition-all gap-2 px-6"
                    >
                        <Download size={18} />
                        PDF Raporu
                    </Button>
                    <Button
                        onClick={() => setIsEditModalOpen(true)}
                        className="h-11 bg-white border border-border text-foreground hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 font-bold rounded-2xl shadow-sm transition-all gap-2 px-6"
                    >
                        <Edit2 size={18} />
                        GÃ¼ncelle
                    </Button>
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

                            <h2 className="text-2xl font-black text-foreground mb-1 uppercase tracking-tight">{customer?.name || 'Ä°simsiz MÃ¼ÅŸteri'}</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">MÃ¼ÅŸteri No: #{customer?.id?.slice?.(0, 8) || 'N/A'}</p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telefon</p>
                                        <p className="text-sm font-bold text-foreground">{customer.phone || 'BelirtilmemiÅŸ'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-teal-600 shadow-sm">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">E-Posta</p>
                                        <p className="text-sm font-bold text-foreground">{customer.email || 'BelirtilmemiÅŸ'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Adres</p>
                                        <p className="text-sm font-bold text-foreground leading-snug">{customer.address || 'BelirtilmemiÅŸ'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-amber-600 shadow-sm">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">NACE Kodu</p>
                                        <p className="text-sm font-bold text-foreground">{customer.naceCode || 'BelirtilmemiÅŸ'}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-muted/50 rounded-2xl border border-transparent hover:border-emerald-100/20 transition-all">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">NACE Bazli Hesap Onerileri</p>
                                    <div className="space-y-2">
                                        {(customer.accountSuggestions || []).slice(0, 3).map((item) => (
                                            <div key={item.code} className="rounded-xl bg-card px-3 py-2 border border-border/60">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-extrabold text-foreground">{item.code} - {item.title}</p>
                                                    <span className="text-[10px] font-bold text-emerald-600">{item.confidence}</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-1">{item.reason}</p>
                                            </div>
                                        ))}
                                        {(!customer.accountSuggestions || customer.accountSuggestions.length === 0) && (
                                            <p className="text-xs text-muted-foreground">NACE kodu ile oneriler burada gorunur.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Communication Section */}
                            <div className="mt-6 pt-6 border-t border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        HÄ±zlÄ± Ä°letiÅŸim
                                    </p>
                                    {/* QR Code Button - Only show on desktop */}
                                    {!isMobileDevice() && customer.phone && (
                                        <button
                                            onClick={() => setIsQRModalOpen(true)}
                                            className="flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all text-[10px] font-bold"
                                            title="QR kod ile mobil cihazdan iletiÅŸim kur"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 8h8v8H3v-8zm2 2v4h4v-4H5zm8-12v8h8V3h-8zm2 2h4v4h-4V5zm4 8h-2v2h2v-2zm-2 2h-2v2h2v-2zm2 0h2v2h-2v-2zm0 2v2h-2v-2h2zm2 0h2v2h-2v-2zm0-2v-2h2v2h-2zm-4-2h2v2h-2v-2z" />
                                            </svg>
                                            QR
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* WhatsApp Button */}
                                    <button
                                        onClick={handleWhatsAppClick}
                                        disabled={!customer.phone}
                                        className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none group"
                                        title={customer.phone ? 'WhatsApp ile mesaj gÃ¶nder' : 'Telefon numarasÄ± yok'}
                                    >
                                        <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">WhatsApp</span>
                                    </button>

                                    {/* SMS Button */}
                                    <button
                                        onClick={handleSMSClick}
                                        disabled={!customer.phone}
                                        className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none group"
                                        title={customer.phone ? 'SMS gÃ¶nder' : 'Telefon numarasÄ± yok'}
                                    >
                                        <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">SMS</span>
                                    </button>

                                    {/* Call Button */}
                                    <button
                                        onClick={handleCallClick}
                                        disabled={!customer.phone}
                                        className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none group"
                                        title={customer.phone ? 'Ara' : 'Telefon numarasÄ± yok'}
                                    >
                                        <PhoneCall size={20} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Ara</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loyalty & Value Card */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-500/10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold">MÃ¼ÅŸteri Sadakati</h3>
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
                                        strokeDashoffset={364 - (364 * (customer?.loyaltyScore || 0)) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black">{customer?.loyaltyScore || 0}</span>
                                    <span className="text-[10px] font-bold opacity-60 uppercase">Puan</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} />
                                    <span className="text-xs font-bold">PortfÃ¶y DeÄŸeri</span>
                                </div>
                                <span className="font-black text-lg">â‚º{totalPortfolioValue.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    <span className="text-xs font-bold">PoliÃ§e SayÄ±sÄ±</span>
                                </div>
                                <span className="font-black text-lg">{customer._count?.sales || 0}</span>
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
                                <h3 className="text-xl font-bold text-foreground">PoliÃ§e ve SatÄ±ÅŸ GeÃ§miÅŸi</h3>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">{(customer.sales || []).length} KayÄ±t</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">PoliÃ§e Bigileri</th>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tutar</th>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">BitiÅŸ Tarihi</th>
                                        <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(!customer?.sales || customer.sales.length === 0) ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-medium italic">HenÃ¼z poliÃ§e/satÄ±ÅŸ kaydÄ± bulunmuyor.</td></tr>
                                    ) : customer.sales.map((sale) => (
                                        <tr key={sale?.id} className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">{sale?.policyType?.name || 'BelirtilmemiÅŸ'}</span>
                                                    <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{sale?.policyNumber || 'No Yok'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-black text-foreground">â‚º{Number(sale?.amount || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-muted-foreground" />
                                                    <span className={`text-sm font-bold ${sale?.endDate && new Date(sale.endDate) < new Date() ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                        {sale?.endDate ? new Date(sale.endDate).toLocaleDateString('tr-TR') : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sale?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                                                    sale?.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600' :
                                                        'bg-yellow-500/10 text-yellow-600'
                                                    }`}>
                                                    {sale?.status || 'LEAD'}
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
                                    <h3 className="font-bold text-foreground">YaklaÅŸan GÃ¶revler</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setIsTaskModalOpen(true)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                    >
                                        <Plus size={14} className="mr-1" /> Yeni GÃ¶rev
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/app/tasks')}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                                    >
                                        TÃ¼mÃ¼
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {(!customer?.tasks || customer.tasks.length === 0) ? (
                                    <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                                        <Calendar size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PlanlanmÄ±ÅŸ gÃ¶rev yok</p>
                                    </div>
                                ) : customer.tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => toggleTaskComplete(task.id, task.isCompleted)}
                                        className="w-full text-left p-4 bg-muted/30 rounded-2xl flex items-start gap-3 group hover:bg-card transition-all border border-transparent hover:border-border shadow-none hover:shadow-sm"
                                    >
                                        <div className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-muted-foreground/40' : 'text-emerald-500'}`}>
                                            {task.isCompleted ? <CheckCircle2 size={18} /> : <div className="h-4.5 w-4.5 rounded-lg border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold transition-all ${task.isCompleted ? 'text-muted-foreground/40 line-through' : 'text-foreground'}`}>{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-bold flex items-center gap-1 ${task.isCompleted ? 'text-muted-foreground/30' : 'text-muted-foreground/80'}`}>
                                                    <Clock size={10} />
                                                    {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </span>
                                                {!task.isCompleted && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${task.priority === 'HIGH' ? 'bg-red-500/10 text-red-600' :
                                                        task.priority === 'MEDIUM' ? 'bg-orange-500/10 text-orange-600' :
                                                            'bg-emerald-500/10 text-emerald-600'
                                                        }`}>
                                                        {task.priority || 'NORMAL'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-indigo-600" />
                                    <h3 className="font-bold text-foreground">Ã–nemli Belgeler</h3>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10">YÃ¶net</Button>
                            </div>
                            <div className="p-4 space-y-3">
                                {(!customer.documents || customer.documents.length === 0) ? (
                                    <p className="p-6 text-center text-xs text-muted-foreground italic">YÃ¼klenmiÅŸ belge bulunmuyor.</p>
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

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-lg rounded-[32px] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">Profil Bilgilerini GÃ¼ncelle</h3>
                                <p className="text-sm text-muted-foreground font-medium">MÃ¼ÅŸteri temel verilerini dÃ¼zenleyin</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">MÃ¼ÅŸteri Ad Soyad</label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="h-12 rounded-2xl bg-muted/50 border-none focus:ring-4 focus:ring-emerald-500/5"
                                    placeholder="Ä°sim giriniz..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Telefon</label>
                                    <Input
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="h-12 rounded-2xl bg-muted/50 border-none focus:ring-4 focus:ring-emerald-500/5"
                                        placeholder="05..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">E-Posta</label>
                                    <Input
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="h-12 rounded-2xl bg-muted/50 border-none focus:ring-4 focus:ring-emerald-500/5"
                                        placeholder="mail@Ã¶rnek.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">TCKN / VKN</label>
                                    <Input
                                        value={editForm.identityNumber}
                                        onChange={(e) => setEditForm({ ...editForm, identityNumber: e.target.value })}
                                        className="h-12 rounded-2xl bg-muted/50 border-none focus:ring-4 focus:ring-emerald-500/5"
                                        placeholder="Vergi veya kimlik no"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">NACE Kodu</label>
                                    <Input
                                        value={editForm.naceCode}
                                        onChange={(e) => setEditForm({ ...editForm, naceCode: e.target.value })}
                                        className="h-12 rounded-2xl bg-muted/50 border-none focus:ring-4 focus:ring-emerald-500/5"
                                        placeholder="Orn: 69.20.01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Adres</label>
                                <textarea
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    rows={3}
                                    className="w-full p-4 rounded-2xl bg-muted/50 border-none focus:ring-4 focus:ring-emerald-500/5 outline-none text-sm text-foreground transition-all resize-none"
                                    placeholder="Ä°kametgah adresi..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Ã–zel Notlar</label>
                                <Input
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    className="h-12 rounded-2xl bg-muted/50 border-none focus:ring-4 focus:ring-emerald-500/5"
                                    placeholder="MÃ¼ÅŸteri hakkÄ±nda kÄ±sa not..."
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-muted/30 border-t border-border flex items-center gap-3">
                            <Button
                                onClick={() => setIsEditModalOpen(false)}
                                variant="ghost"
                                className="flex-1 h-12 rounded-2xl font-bold text-muted-foreground"
                            >
                                Ä°ptal Et
                            </Button>
                            <Button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        DeÄŸiÅŸiklikleri Kaydet
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Creation Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-md rounded-[32px] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-blue-600">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Yeni GÃ¶rev OluÅŸtur</h3>
                                <p className="text-xs text-white/70 font-bold uppercase tracking-widest">{customer?.name}</p>
                            </div>
                            <button
                                onClick={() => setIsTaskModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">GÃ¶rev Konusu</label>
                                <Input
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/50 border-none font-bold"
                                    placeholder="Ã–rn: Evrak talebi iÃ§in ara"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">AÃ§Ä±klama</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    className="w-full min-h-[100px] p-3 rounded-xl bg-muted/50 border-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                                    placeholder="DetaylÄ± notlar..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">BitiÅŸ Tarihi</label>
                                    <Input
                                        type="datetime-local"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                        className="h-11 rounded-xl bg-muted/50 border-none font-bold text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Ã–ncelik</label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                        className="w-full h-11 rounded-xl bg-muted/50 border-none text-xs font-bold px-3 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                                    >
                                        <option value="LOW">DÃ¼ÅŸÃ¼k</option>
                                        <option value="MEDIUM">Orta</option>
                                        <option value="HIGH">YÃ¼ksek</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                onClick={handleCreateTask}
                                disabled={saving || !taskForm.title || !taskForm.dueDate}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all mt-4"
                            >
                                {saving ? 'OluÅŸturuluyor...' : 'GÃ¶revi Kaydet'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* QR Code Modal */}
            {customer && (
                <QRCodeModal
                    isOpen={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    customerName={customer.name}
                    phone={customer.phone || ''}
                />
            )}
        </div>
    );
}


