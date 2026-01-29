import { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, TrendingUp, Building2, Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Branch {
    id: string;
    name: string;
    settings: {
        commissionRate: number;
    };
}

export default function CommissionsPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRates, setEditingRates] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

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

            const rates: Record<string, string> = {};
            res.data.forEach((branch: Branch) => {
                rates[branch.id] = branch.settings?.commissionRate?.toString() || '0.10';
            });
            setEditingRates(rates);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (branchId: string, branchName: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/branches/${branchId}`, {
                name: branchName,
                commissionRate: Number(editingRates[branchId])
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Komisyon oranı güncellendi!');
            fetchBranches();
        } catch (error) {
            alert('Komisyon oranı güncellenemedi');
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
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Varsayılan Komisyonlar</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Şubeler için baz komisyon oranlarını yönetin</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[32px] flex items-start gap-4 shadow-sm shadow-emerald-500/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <Info size={20} />
                </div>
                <div>
                    <h4 className="text-emerald-500 font-bold text-sm">Önemli Hatırlatma</h4>
                    <p className="text-emerald-400 text-xs font-medium mt-1 leading-relaxed">
                        Buradaki oranlar, herhangi bir özel komisyon kuralı (Commission Rules) tanımlanmamış poliçeler için geçerli olan varsayılan değerlerdir.
                        Oran 0.0 ile 1.0 arasında olmalıdır (Örn: 0.12 = %12).
                    </p>
                </div>
            </div>

            {/* Search & List */}
            <div className="space-y-6">
                <div className="relative group max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Şube ara..."
                        className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl outline-none text-sm text-foreground focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest">Yükleniyor...</div>
                    ) : filteredBranches.map((branch) => (
                        <div key={branch.id} className="bg-card p-8 rounded-[40px] border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground leading-tight">{branch.name}</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Şube Varsayılanı</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Komisyon Oranı</label>
                                        <span className="text-[11px] font-black text-emerald-500">%{((Number(editingRates[branch.id]) || 0) * 100).toFixed(0)}</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={editingRates[branch.id] || ''}
                                            onChange={(e) => setEditingRates({
                                                ...editingRates,
                                                [branch.id]: e.target.value
                                            })}
                                            className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/10 text-sm font-black pl-10 transition-all"
                                        />
                                        <TrendingUp size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleSave(branch.id, branch.name)}
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Oranı Güncelle
                                </Button>
                            </div>

                            {/* Decorative Background */}
                            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/5 rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
