import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Percent, Calculator, Activity, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Branch {
    id: string;
    name: string;
}

interface PolicyType {
    id: string;
    name: string;
}

interface CommissionRule {
    id: string;
    name: string;
    branchId?: string;
    branch?: { name: string };
    policyTypeId?: string;
    policyType?: { name: string };
    formula: string;
    validFrom: string;
    validTo?: string;
}

export default function CommissionRulesPage() {
    const [rules, setRules] = useState<CommissionRule[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [branchId, setBranchId] = useState('');
    const [policyTypeId, setPolicyTypeId] = useState('');
    const [formula, setFormula] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');

    // Simulation state
    const [simAmount, setSimAmount] = useState('');
    const [simBranchId, setSimBranchId] = useState('');
    const [simPolicyTypeId, setSimPolicyTypeId] = useState('');
    const [simDate, setSimDate] = useState(new Date().toISOString().split('T')[0]);
    const [simResult, setSimResult] = useState<any>(null);

    useEffect(() => {
        fetchRules();
        fetchBranches();
        fetchPolicyTypes();
    }, []);

    const fetchRules = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/commission/rules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(res.data);
        } catch (error) {
            console.error('Failed to fetch rules', error);
        } finally {
            setLoading(false);
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
            console.error('Failed to fetch branches', error);
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
            console.error('Failed to fetch policy types', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/commission/rules', {
                name,
                branchId: branchId || null,
                policyTypeId: policyTypeId || null,
                formula,
                validFrom: new Date(validFrom).toISOString(),
                validTo: validTo ? new Date(validTo).toISOString() : null,
                conditions: {}
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setName('');
            setBranchId('');
            setPolicyTypeId('');
            setFormula('');
            setValidFrom('');
            setValidTo('');

            fetchRules();
        } catch (error) {
            alert('Kural oluşturulamadı');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/commission/rules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRules();
        } catch (error) {
            alert('Kural silinemedi');
        }
    };

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/commission/simulate', {
                amount: Number(simAmount),
                branchId: simBranchId,
                policyTypeId: simPolicyTypeId,
                date: simDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSimResult(res.data);
        } catch (error) {
            alert('Simülasyon hatası');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Komisyon Motoru</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Dinamik prim hesaplama kurallarını ve simülatörü yönetin</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-gray-200 text-gray-600 font-bold h-11">
                        <HelpCircle size={18} className="mr-2" /> Dökümantasyon
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Side: Rule Creation & List */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Create Rule Card */}
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl pointer-events-none"></div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">Yeni Kural Tanımla</h3>
                                <p className="text-xs text-gray-400 font-medium tracking-wide">Branş veya şube bazlı özel komisyon oranları</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Kural Adı</label>
                                <Input
                                    placeholder="Istanbul Kasko Bonusu"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Şube Kısıtı</label>
                                <select
                                    className="w-full h-12 bg-gray-50 border-none rounded-xl px-4 outline-none text-sm font-bold text-gray-700"
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                >
                                    <option value="">Tüm Şubeler</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Branş Kısıtı</label>
                                <select
                                    className="w-full h-12 bg-gray-50 border-none rounded-xl px-4 outline-none text-sm font-bold text-gray-700"
                                    value={policyTypeId}
                                    onChange={(e) => setPolicyTypeId(e.target.value)}
                                >
                                    <option value="">Tüm Branşlar</option>
                                    {policyTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Komisyon Formülü</label>
                                <div className="relative group">
                                    <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    <Input
                                        placeholder="ratio:0.15"
                                        value={formula}
                                        onChange={(e) => setFormula(e.target.value)}
                                        className="h-12 bg-gray-50 border-none rounded-xl pl-11 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-mono font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Başlangıç Tarihi</label>
                                <Input
                                    type="date"
                                    value={validFrom}
                                    onChange={(e) => setValidFrom(e.target.value)}
                                    className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bitiş Tarihi (Opsiyonel)</label>
                                <Input
                                    type="date"
                                    value={validTo}
                                    onChange={(e) => setValidTo(e.target.value)}
                                    className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold"
                                />
                            </div>

                            <div className="md:col-span-2 lg:col-span-3">
                                <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 mt-2">
                                    Kuralı Kaydet & Aktif Et
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Rules Table Redesigned as Cards */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mevcut Kurallar ({rules.length})</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="col-span-full py-20 text-center animate-pulse text-gray-400 font-bold">Yükleniyor...</div>
                            ) : rules.length === 0 ? (
                                <div className="col-span-full bg-white p-20 rounded-[32px] border border-dashed border-gray-200 text-center text-gray-400 font-bold italic">
                                    Henüz kural tanımlanmamış.
                                </div>
                            ) : rules.map(rule => (
                                <div key={rule.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors">{rule.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                    {rule.branch?.name || 'GLOBAL'}
                                                </span>
                                                <ChevronRight size={10} className="text-gray-300" />
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                    {rule.policyType?.name || 'TÜM BRANŞLAR'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="mt-6 flex items-end justify-between relative z-10">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">KOMİSYON</p>
                                            <p className="text-2xl font-black text-gray-900 font-mono">{rule.formula}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">GEÇERLİLİK</p>
                                            <p className="text-[11px] font-bold text-gray-600 mt-0.5">
                                                {new Date(rule.validFrom).toLocaleDateString()}
                                                {rule.validTo ? ` - ${new Date(rule.validTo).toLocaleDateString()}` : ' (Süresiz)'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-xl"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Calculator / Simulator */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <Calculator size={160} className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700" />

                        <div className="flex items-center gap-3 mb-8 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">Ücret Simülatörü</h3>
                        </div>

                        <form onSubmit={handleSimulate} className="space-y-5 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Poliçe Tutarı (₺)</label>
                                <Input
                                    type="number"
                                    placeholder="5000"
                                    value={simAmount}
                                    onChange={(e) => setSimAmount(e.target.value)}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-4 focus:ring-emerald-500/20 text-white transition-all font-bold placeholder:text-gray-600"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Şube</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-sm font-bold text-white"
                                        value={simBranchId}
                                        onChange={(e) => setSimBranchId(e.target.value)}
                                        required
                                    >
                                        <option value="" className="text-gray-900">Seçiniz...</option>
                                        {branches.map(b => <option key={b.id} value={b.id} className="text-gray-900">{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Branş</label>
                                    <select
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none text-sm font-bold text-white"
                                        value={simPolicyTypeId}
                                        onChange={(e) => setSimPolicyTypeId(e.target.value)}
                                        required
                                    >
                                        <option value="" className="text-gray-900">Seçiniz...</option>
                                        {policyTypes.map(pt => <option key={pt.id} value={pt.id} className="text-gray-900">{pt.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Simülasyon Tarihi</label>
                                <Input
                                    type="date"
                                    value={simDate}
                                    onChange={(e) => setSimDate(e.target.value)}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-4 focus:ring-emerald-500/20 text-white transition-all font-bold"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl shadow-xl shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs mt-4">
                                Komisyonu Hesapla
                            </Button>
                        </form>

                        {/* Result Area */}
                        <div className={`mt-10 transition-all duration-500 ${simResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 pointer-events-none overflow-hidden'}`}>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>

                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-2">Hesaplanan Hakediş</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white">₺{simResult?.amount.toLocaleString()}</span>
                                    {simResult?.source === 'RULE' && <ShieldCheck size={18} className="text-emerald-500 animate-pulse" />}
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-gray-400 font-medium">Uygulanan Mantık:</span>
                                        <span className={`px-2 py-0.5 rounded font-bold ${simResult?.source === 'RULE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {simResult?.source === 'RULE' ? 'ÖZEL KURAL' : 'VARSYILAN ŞUBE'}
                                        </span>
                                    </div>
                                    {simResult?.ruleName && (
                                        <div className="flex justify-between items-baseline text-[11px]">
                                            <span className="text-gray-400 font-medium">Kural:</span>
                                            <span className="font-bold text-right text-white max-w-[150px] truncate">{simResult.ruleName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!simResult && (
                            <div className="mt-10 py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <Activity size={24} className="mx-auto text-white/10 mb-2" />
                                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest px-8">Ücreti hesaplamak için verileri girin</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Tips or Integration Card */}
                    <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 shadow-sm">
                        <h4 className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm mb-3">
                            <Activity size={16} /> Biliyor muydunuz?
                        </h4>
                        <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                            Komisyon kuralları en spesifik olandan en genele doğru taranır. Şuna göre bir öncelik sırası vardır:
                            <span className="block mt-1 font-bold">1. Şube + Branş</span>
                            <span className="block font-bold">2. Branş Özel (Global)</span>
                            <span className="block font-bold">3. Şube Varsayılanı</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
