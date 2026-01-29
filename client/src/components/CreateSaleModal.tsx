import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/FileUpload';

interface CreateSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateSaleModal({ isOpen, onClose, onSuccess }: CreateSaleModalProps) {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [branchId, setBranchId] = useState('');
    const [policyTypeId, setPolicyTypeId] = useState('');
    const [employeeId, setEmployeeId] = useState('');

    const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
    const [policyTypes, setPolicyTypes] = useState<{ id: string, name: string }[]>([]);
    const [employees, setEmployees] = useState<{ id: string, name: string, role: string }[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'upload'>('form');
    const [createdSaleId, setCreatedSaleId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchFormData();
        }
    }, [isOpen]);

    const fetchFormData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [bRes, ptRes, uRes] = await Promise.all([
                axios.get('/api/branches', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/policy-types', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setBranches(bRes.data);
            setPolicyTypes(ptRes.data);
            setEmployees(uRes.data);

            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserRole(user.role);

                // Pre-fill branch for non-admins
                if (user.branchId) {
                    setBranchId(user.branchId);
                }

                if (user.role === 'EMPLOYEE') {
                    setEmployeeId(user.id);
                }

                // Filter personnel list if Manager
                if (user.role === 'MANAGER') {
                    setEmployees(uRes.data.filter((e: any) => e.branchId === user.branchId));
                } else if (user.role === 'ADMIN') {
                    setEmployees(uRes.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch modal data', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            const res = await axios.post('/api/sales', {
                customerName,
                customerPhone,
                customerEmail,
                policyNumber,
                amount: Number(amount),
                branchId,
                policyTypeId,
                employeeId: employeeId || currentUser.id,
                status: 'ACTIVE'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
            setCreatedSaleId(res.data.id);
            setStep('upload');
            // handleClose(); // Don't close immediately
        } catch (error: any) {
            console.error('Failed to create sale:', error);
            alert('Satış kaydı oluşturulurken bir hata oluştu: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setPolicyNumber('');
        setAmount('');
        setStep('form');
        setCreatedSaleId(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-border">
                <div className="p-8 border-b border-border flex items-center justify-between bg-emerald-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-foreground">Yeni Satış Girişi</h3>
                            <p className="text-sm text-muted-foreground font-medium">Yeni poliçe bilgilerini eksiksiz giriniz.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-3 bg-muted text-muted-foreground hover:text-foreground rounded-2xl border border-border shadow-sm transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Müşteri Adı</label>
                                <Input
                                    placeholder="Ahmet Yılmaz"
                                    className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Müşteri Telefon</label>
                                <Input
                                    placeholder="05..."
                                    className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Müşteri E-posta</label>
                                <Input
                                    placeholder="ornek@mail.com"
                                    className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Poliçe Numarası</label>
                                <Input
                                    placeholder="POL-2024-001"
                                    className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    value={policyNumber}
                                    onChange={(e) => setPolicyNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Tutar (₺)</label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Branş</label>
                                <select
                                    className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-bold text-foreground focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                    value={policyTypeId}
                                    onChange={(e) => setPolicyTypeId(e.target.value)}
                                    required
                                >
                                    <option value="">Branş Seçiniz...</option>
                                    {policyTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                </select>
                            </div>
                            {userRole === 'ADMIN' ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Şube</label>
                                    <select
                                        className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-bold text-foreground focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        required
                                    >
                                        <option value="">Şube Seçiniz...</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-2 opacity-60">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Kendi Şubeniz</label>
                                    <div className="h-12 bg-muted flex items-center px-4 rounded-xl text-sm font-bold text-foreground">
                                        {branches.find(b => b.id === branchId)?.name || 'Şube Yükleniyor...'}
                                    </div>
                                </div>
                            )}
                            {userRole !== 'EMPLOYEE' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Personel</label>
                                    <select
                                        className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-bold text-foreground focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value)}
                                    >
                                        <option value="">Benim Üzerime Al</option>
                                        {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted border-border transition-all"
                                onClick={handleClose}
                            >
                                Vazgeç
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                            >
                                {loading ? 'Kaydediliyor...' : 'Satışı Kaydet'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="p-8 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <CheckCircle2 size={32} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold text-foreground">Satış Başarıyla Oluşturuldu!</h3>
                            <p className="text-muted-foreground">Dilerseniz şimdi bu satışa ait dosyaları yükleyebilirsiniz.</p>
                        </div>

                        <div className="w-full bg-muted p-6 rounded-2xl border border-border">
                            <FileUpload saleId={createdSaleId!} />
                        </div>

                        <div className="flex w-full pt-4">
                            <Button
                                onClick={handleClose}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                İşlemi Tamamla
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
