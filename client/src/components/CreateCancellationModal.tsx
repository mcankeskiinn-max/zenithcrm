import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateCancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateCancellationModal({ isOpen, onClose, onSuccess }: CreateCancellationModalProps) {
    const [customerName, setCustomerName] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [branchId, setBranchId] = useState('');
    const [policyTypeId, setPolicyTypeId] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    const [policyTypes, setPolicyTypes] = useState<{ id: string, name: string }[]>([]);
    const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFormData();
        }
    }, [isOpen]);

    const fetchFormData = async () => {
        try {
            const token = localStorage.getItem('token');
            const ptRes = await axios.get('/api/policy-types', { headers: { Authorization: `Bearer ${token}` } });
            setPolicyTypes(ptRes.data);

            // Set default branch if user is assigned to one
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.branchId) setBranchId(user.branchId);
            }

            // Also fetch branches names if admin
            const branchesRes = await axios.get('/api/branches', { headers: { Authorization: `Bearer ${token}` } });
            setBranches(branchesRes.data);
        } catch (error) {
            console.error('Failed to fetch modal data', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            await axios.post('/api/sales', {
                customerName,
                policyNumber,
                amount: Number(amount),
                branchId,
                policyTypeId,
                employeeId: user.id,
                status: 'CANCELLED',
                cancelReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Failed to create cancellation:', error);
            alert('İptal kaydı oluşturulurken bir hata oluştu: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCustomerName('');
        setPolicyNumber('');
        setAmount('');
        setCancelReason('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-red-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Yeni İptal Kaydı</h3>
                            <p className="text-sm text-gray-500 font-medium">İptal edilen poliçe bilgilerini giriniz.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-3 bg-white text-gray-400 hover:text-gray-600 rounded-2xl border border-gray-100 shadow-sm transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Müşteri Adı</label>
                            <Input
                                placeholder="Ahmet Yılmaz"
                                className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-red-500/5 transition-all"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Poliçe Numarası</label>
                            <Input
                                placeholder="POL-2024-001"
                                className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-red-500/5 transition-all"
                                value={policyNumber}
                                onChange={(e) => setPolicyNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">İptal Tutarı (₺)</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-12 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-red-500/5 transition-all"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Branş</label>
                            <select
                                className="w-full h-12 bg-gray-50 border-none rounded-xl outline-none px-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-red-500/5 transition-all appearance-none"
                                value={policyTypeId}
                                onChange={(e) => setPolicyTypeId(e.target.value)}
                                required
                            >
                                <option value="">Branş Seçiniz...</option>
                                {policyTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2 opacity-60">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">İşlem Şubesi</label>
                            <div className="h-12 bg-gray-100 flex items-center px-4 rounded-xl text-sm font-bold text-gray-600">
                                {branches.find(b => b.id === branchId)?.name || 'Şube Yükleniyor...'}
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">İptal Nedeni</label>
                            <select
                                className="w-full h-12 bg-gray-50 border-none rounded-xl outline-none px-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-red-500/5 transition-all appearance-none"
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
                            className="flex-1 h-14 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 border-gray-100 transition-all"
                            onClick={handleClose}
                        >
                            Vazgeç
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5"
                        >
                            {loading ? 'Kaydediliyor...' : 'İptali Kaydet'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
