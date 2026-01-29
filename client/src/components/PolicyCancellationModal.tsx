import React, { useState } from 'react';
import axios from 'axios';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Policy {
    id: string;
    policyNumber: string;
    customerName: string;
    amount: number;
    branchId: string;
    policyTypeId: string;
    policyType?: { name: string };
}

interface PolicyCancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    policy: Policy | null;
}

export default function PolicyCancellationModal({ isOpen, onClose, onSuccess, policy }: PolicyCancellationModalProps) {
    const [cancelReason, setCancelReason] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Update amount when policy changes
    React.useEffect(() => {
        if (policy) {
            setAmount(policy.amount.toString());
        }
    }, [policy]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!policy) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

            await axios.post('/api/sales', {
                customerName: policy.customerName,
                policyNumber: policy.policyNumber,
                amount: Number(amount),
                branchId: policy.branchId,
                policyTypeId: policy.policyTypeId,
                employeeId: currentUser.id,
                status: 'CANCELLED',
                cancelReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Failed to cancel policy:', error);
            alert('İptal işlemi sırasında bir hata oluştu: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCancelReason('');
        onClose();
    };

    if (!isOpen || !policy) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-border">
                <div className="p-8 border-b border-border flex items-center justify-between bg-red-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-foreground">Poliçeyi İptal Et</h3>
                            <p className="text-sm text-muted-foreground font-medium">#{policy.policyNumber} - {policy.customerName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-3 bg-muted text-muted-foreground hover:text-foreground rounded-2xl border border-border shadow-sm transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-muted p-4 rounded-2xl border border-border flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-emerald-500 shadow-sm">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Poliçe Branşı</p>
                            <p className="text-sm font-bold text-foreground">{policy.policyType?.name || 'Belirtilmemiş'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">İade/İptal Tutarı (₺)</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-12 bg-muted border-none rounded-xl focus:ring-4 focus:ring-red-500/5 transition-all text-sm font-medium"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">İptal Nedeni</label>
                            <select
                                className="w-full h-12 bg-muted border-none rounded-xl outline-none px-4 text-sm font-bold text-foreground focus:ring-4 focus:ring-red-500/5 transition-all appearance-none"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                required
                            >
                                <option value="">Neden Seçiniz...</option>
                                <option value="Yüksek Fiyat">Yüksek Fiyat</option>
                                <option value="Müşteri İsteği">Müşteri İsteği</option>
                                <option value="Ödeme Yapılmadı">Ödeme Yapılmadı</option>
                                <option value="Başka Acente">Başka Acente</option>
                                <option value="Riskin Bitmesi/Satış">Riskin Bitmesi / Satış</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                        </div>
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
                            className="flex-[2] h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5"
                        >
                            {loading ? 'İşleniyor...' : 'İptali Onayla'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
