import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    const [tenantName, setTenantName] = useState('');
    const [tenantLogo, setTenantLogo] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Sync activeTab with searchParams
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
        setMessage({ type: '', text: '' });
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
const res = await axios.get('/api/auth/me', {
                    
                });
                setUser(res.data.user);
                setName(res.data.user.name);
                setEmail(res.data.user.email);
                setTenantName(res.data.user.tenant?.name || '');
                setTenantLogo(res.data.user.tenant?.logo || '');
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
const res = await axios.put('/api/auth/profile', { name, email }, {
                
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

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Şifreler uyuşmuyor' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
await axios.put('/api/auth/change-password', {
                currentPassword,
                newPassword
            }, {
                
            });
            setMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Güncelleme başarısız' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
await axios.put('/api/tenants/preferences', {
                name: tenantName,
                logo: tenantLogo
            }, {
                
            });

            // Update local user object
            const newUser = {
                ...user,
                tenant: {
                    ...(user?.tenant || {}),
                    name: tenantName,
                    logo: tenantLogo
                }
            };
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));

            setMessage({ type: 'success', text: 'İşletme tercihleri güncellendi' });
            // Refresh to update sidebar branding
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Güncelleme başarısız' });
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
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Ayarlar</h1>
                <p className="text-sm text-muted-foreground font-medium mt-1">Hesap ve sistem seçeneklerini buradan yönetebilirsiniz</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:w-64 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                                    : "text-muted-foreground hover:bg-card hover:text-foreground"
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
                        <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold shadow-inner">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">{user?.name}</h3>
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
                                                className="h-12 bg-muted border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
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
                                                className="h-12 bg-muted border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
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
                        <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Key size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Şifre Değiştir</h3>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Mevcut Şifre</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="h-12 bg-muted border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
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
                                                className="h-12 bg-muted border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
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
                                                className="h-12 bg-muted border-none rounded-2xl pl-12 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
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

                    {activeTab === 'preferences' && user?.role === 'ADMIN' && (
                        <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Globe size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">İşletme Tercihleri</h3>
                            </div>

                            <form onSubmit={handleUpdateTenant} className="space-y-6">
                                <div className="space-y-6 p-6 bg-muted/30 rounded-[32px] border border-border/50">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">İşletme Adı</label>
                                        <Input
                                            value={tenantName}
                                            onChange={(e) => setTenantName(e.target.value)}
                                            className="h-12 bg-card border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                            placeholder="Örn: Can Sigorta"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo URL</label>
                                        <Input
                                            value={tenantLogo}
                                            onChange={(e) => setTenantLogo(e.target.value)}
                                            className="h-12 bg-card border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                            placeholder="https://..."
                                        />
                                        <p className="text-[10px] text-muted-foreground ml-1 italic">* Logonuzun kare (square) ölçülerde olması tavsiye edilir.</p>
                                    </div>

                                    {tenantLogo && (
                                        <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50">
                                            <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border">
                                                <img src={tenantLogo} alt="Logo Önizleme" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-xs font-bold text-muted-foreground">Logo Önizleme</p>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Tercihleri Kaydet
                                </Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'preferences' && user?.role !== 'ADMIN' && (
                        <div className="bg-card p-12 rounded-[40px] border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 opacity-20">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Yetkiniz Yok</h3>
                                <p className="text-sm text-gray-400 max-w-xs">İşletme ayarlarını yalnızca Sistem Yöneticileri değiştirebilir.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-card p-12 rounded-[40px] border border-border shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-gray-300">
                                <Smartphone size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Çok Yakında</h3>
                                <p className="text-sm text-gray-400 max-w-xs">Bu özellik geliştirme aşamasındadır.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

