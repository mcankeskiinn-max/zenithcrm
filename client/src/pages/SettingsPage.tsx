import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    User,
    Lock,
    Bell,
    Shield,
    Smartphone,
    Globe,
    Save,
    Key,
    UserCircle,
    Mail,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data.user);
                setName(res.data.user.name);
                setEmail(res.data.user.email);
            } catch (error) {
                console.error('Failed to fetch user', error);
            }
        };
        fetchUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('/api/auth/profile', { name, email }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Profil güncellenemedi' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' });
            return;
        }
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/auth/change-password', {
                currentPassword,
                newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Şifre güncellenemedi' });
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profil Bilgileri', icon: UserCircle },
        { id: 'security', label: 'Güvenlik', icon: Shield },
        { id: 'notifications', label: 'Bildirimler', icon: Bell },
        { id: 'preferences', label: 'Tercihler', icon: Globe },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ayarlar</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">Hesap ve sistem seçeneklerini buradan yönetebilirsiniz</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:w-64 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setMessage({ type: '', text: '' });
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                                        : "text-gray-500 hover:bg-white hover:text-gray-900"
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 max-w-2xl">
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-bold">{message.text}</span>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold shadow-inner">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{user?.role} • {user?.branch?.name || 'Genel Merkez'}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Soyad</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-12 bg-gray-50 border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                placeholder="Adınız Soyadınız"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-12 bg-gray-50 border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                placeholder="ornek@zenithcrm.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Değişiklikleri Kaydet
                                </Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Key size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Şifre Değiştir</h3>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Mevcut Şifre</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="h-12 bg-gray-50 border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Yeni Şifre</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="h-12 bg-gray-50 border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Yeni Şifre Tekrar</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="h-12 bg-gray-50 border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Şifreyi Güncelle
                                </Button>
                            </form>
                        </div>
                    )}

                    {(activeTab === 'notifications' || activeTab === 'preferences') && (
                        <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <Smartphone size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Çok Yakında</h3>
                                <p className="text-sm text-gray-400 max-w-xs">Bu özellik geliştirme aşamasındadır. ZenithCRM deneyiminizi zenginleştirmek için çalışıyoruz.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
