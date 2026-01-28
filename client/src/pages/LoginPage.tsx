import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { register, handleSubmit } = useForm();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            const rawApiUrl = import.meta.env.VITE_API_URL || '';
            const apiUrl = rawApiUrl.replace(/\/$/, '');
            const res = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || 'Giriş başarısız');
                setIsLoading(false);
                return;
            }

            localStorage.setItem('token', json.accessToken);
            localStorage.setItem('user', JSON.stringify(json.user));

            navigate('/dashboard');
        } catch (err) {
            setError('Bağlantı hatası oluştu');
            setIsLoading(false);
        }
    };

    const features = [
        "Profesyonel Satış Takibi",
        "Otomatik Prim Hesaplama",
        "Müşteri İlişkileri Yönetimi",
        "Detaylı Analiz ve Raporlama"
    ];

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Panel - Brand */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[120px]"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200 overflow-hidden">
                            <img src="/logo.png" alt="ZenithCRM" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">ZenithCRM</span>
                    </div>

                    <div className="max-w-md mt-12">
                        <h1 className="text-5xl font-extrabold leading-tight mb-6">
                            Satışlarınızı <br />
                            <span className="text-emerald-200 text-6xl">Güçlendirin.</span>
                        </h1>
                        <p className="text-lg text-emerald-50/80 mb-8 leading-relaxed">
                            Acenteniz için modern, hızlı ve verimli yönetim paneli. Her adımda yanınızdayız.
                        </p>

                        <div className="space-y-4">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="bg-emerald-400/20 p-1 rounded-full">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                                    </div>
                                    <span className="text-emerald-50 font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-8 border-t border-white/10 text-emerald-100/60 text-sm">
                    © 2026 ZenithCRM. Tüm hakları saklıdır.
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 lg:bg-white">
                <div className="w-full max-w-[440px] space-y-8 animate-in fade-in duration-500">
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="ZenithCRM" className="w-full h-full object-cover opacity-80" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">ZenithCRM</span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Hoş Geldiniz</h2>
                        <p className="text-gray-500">Devam etmek için hesabınıza giriş yapın</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">E-posta Adresi</label>
                                <Input
                                    type="email"
                                    placeholder="ornek@firma.com"
                                    className="h-12 px-4 rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base"
                                    {...register('email', { required: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Şifre</label>
                                <div className="relative group">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        className="h-12 px-4 rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base"
                                        {...register('password', { required: true })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between ml-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Beni Hatırla</span>
                            </label>
                            <a href="#" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Şifremi Unuttum</a>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center gap-3 animate-in shake duration-300">
                                <div className="w-1 h-1 bg-red-600 rounded-full" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </Button>
                    </form>

                    <div className="pt-8 border-t border-gray-100 text-center">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Demo Hesapları</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-sm">
                                    <p className="font-bold text-gray-700">Yönetici:</p>
                                    <p className="text-xs text-gray-500">admin@sigorta.com / password123</p>
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-gray-700">Müdür:</p>
                                    <p className="text-xs text-gray-500">mert@sigorta.com / password123</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
