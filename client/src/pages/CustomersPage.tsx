import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Users,
    Search,
    UserPlus,
    Phone,
    Mail,
    Calendar,
    ChevronRight,
    SearchX
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Customer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    identityNumber: string | null;
    createdAt: string;
    _count: {
        sales: number;
        tasks: number;
    }
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/customers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(res.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Müşteri Portföyü</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Sistemdeki tüm müşteriler ve özet bilgileri</p>
                </div>

                <Button className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2">
                    <UserPlus size={20} />
                    Yeni Müşteri
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="İsim, telefon veya e-posta ile ara..."
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
                        <p className="font-bold">Müşteri bulunamadı</p>
                        <p className="text-sm">Farklı bir arama terimi deneyin veya yeni bir kayıt oluşturun.</p>
                    </div>
                ) : filteredCustomers.map((customer) => (
                    <div
                        key={customer.id}
                        className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                        onClick={() => window.location.href = `/customers/${customer.id}`}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{customer.name}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Müşteri ID: {customer.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <ChevronRight size={18} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 bg-muted rounded-2xl">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Poliçe Sayısı</p>
                                <p className="text-lg font-black text-foreground">{customer._count.sales}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-2xl">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Açık Görevler</p>
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
                                Kayıt: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
