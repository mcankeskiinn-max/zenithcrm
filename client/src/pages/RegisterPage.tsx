import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import {
    Rocket,
    AlertCircle,
    Loader2,
    Mail,
    Lock,
    User as UserIcon,
    Building2,
    ArrowRight,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors: _errors } } = useForm({
        defaultValues: {
            agencyName: '',
            name: '',
            email: '',
            password: '',
            isSingleBranch: true
        }
    });
    const isSingleBranch = watch('isSingleBranch');

    const onSubmit = async (data: any) => {
        console.log('Registration attempt:', { ...data, password: '***' });
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    agencyName: data.agencyName,
                    adminName: data.name,
                    email: data.email,
                    password: data.password,
                    isSingleBranch: data.isSingleBranch
                }) });

            console.log('Server response status:', response.status);
            const contentType = response.headers.get("content-type");
            console.log('Server response content-type:', contentType);

            if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.log('Server response text (not JSON):', text);
                if (!response.ok) throw new Error(text || 'Sunucudan geçersiz yanıt alındı');
                return;
            }

            const result = await response.json();
            console.log('Server response JSON:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Kayıt başarısız oldu');
            }

            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            console.error('Registration Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background dark:bg-emerald-950 flex items-center justify-center p-4 transition-colors duration-500">
                <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/20">
                        <Rocket className="w-12 h-12 text-emerald-500 animate-bounce" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-emerald-950 dark:text-white">Harika!</h2>
                        <p className="text-xl text-emerald-900/60 dark:text-emerald-100/80">
                            Acenteniz başarıyla oluşturuldu. <br />
                            Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-75" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-150" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background dark:bg-emerald-950 text-foreground dark:text-emerald-50 transition-colors duration-500">
            {/* Left Panel - Branding & Benefits */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />

                <div className="flex items-center gap-2 mb-12 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">Zenith<span className="text-emerald-200">CRM</span></span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-sm font-bold mb-6">
                        <ShieldCheck className="w-4 h-4" />
                        Acenteler İçin 1 Numara
                    </div>
                    <h1 className="text-6xl font-black leading-tight mb-8">
                        Acentenizi <br />
                        <span className="text-emerald-200">Geleceğe</span> Hazırlayın.
                    </h1>
                    <div className="space-y-6">
                        {[
                            { icon: CheckCircle2, text: "Saniyeler içinde dijitalleşin" },
                            { icon: CheckCircle2, text: "Sınırsız şube ve personel yönetimi" },
                            { icon: CheckCircle2, text: "Gelişmiş OCR ile poliçe tarama" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 text-emerald-50/90 group">
                                <div className="p-1 rounded-full bg-emerald-400 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-4 h-4 text-emerald-950" />
                                </div>
                                <span className="font-semibold text-lg">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 pt-12 border-t border-white/10">
                    <p className="text-emerald-100/70 text-sm">
                        © 2024 ZenithCRM. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>

            {/* Right Panel - Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background dark:bg-emerald-950 transition-colors duration-500">
                <div className="w-full max-w-[480px] space-y-8 animate-in fade-in duration-500">
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                            <Rocket className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-2xl font-black text-emerald-950 dark:text-white tracking-tighter">ZenithCRM</span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl font-black tracking-tight text-foreground dark:text-white">Ücretsiz Deneyin</h2>
                        <p className="text-muted-foreground dark:text-emerald-300/60 text-lg">Acentenizi sisteme kaydedin ve hemen başlayın.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground/70 dark:text-emerald-200 ml-1">Acente Adı</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Örn: Güven Sigorta"
                                        className="h-12 pl-12 pr-4 rounded-xl border-border bg-muted dark:bg-emerald-900/40 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base dark:text-emerald-50"
                                        {...register('agencyName', { required: true })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground/70 dark:text-emerald-200 ml-1">Adınız</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Örn: Ahmet Yılmaz"
                                        className="h-12 pl-12 pr-4 rounded-xl border-border bg-muted dark:bg-emerald-900/40 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base dark:text-emerald-50"
                                        {...register('name', { required: true })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="text-sm font-bold text-foreground/70 dark:text-emerald-200 ml-1">İşletme Yapısı</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setValue('isSingleBranch', true)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 text-left",
                                        isSingleBranch
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                                            : "border-border bg-muted dark:bg-emerald-900/20 hover:border-emerald-500/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            isSingleBranch ? "bg-emerald-500 text-white" : "bg-muted-foreground/10 text-muted-foreground"
                                        )}>
                                            <Building2 size={20} />
                                        </div>
                                        {isSingleBranch && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight">Tek Şube</h4>
                                        <p className="text-[10px] text-muted-foreground leading-tight mt-1">Butik ve yerel acenteler için sade paneller.</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setValue('isSingleBranch', false)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 text-left",
                                        !isSingleBranch
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                                            : "border-border bg-muted dark:bg-emerald-900/20 hover:border-emerald-500/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            !isSingleBranch ? "bg-emerald-500 text-white" : "bg-muted-foreground/10 text-muted-foreground"
                                        )}>
                                            <Building2 size={20} className="scale-110" />
                                        </div>
                                        {!isSingleBranch && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight">Çok Şubeli</h4>
                                        <p className="text-[10px] text-muted-foreground leading-tight mt-1">Geniş ağlar için gelişmiş organizasyon yönetimi.</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/70 dark:text-emerald-200 ml-1">İş E-postası</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="ornek@acente.com"
                                    className="h-12 pl-12 pr-4 rounded-xl border-border bg-muted dark:bg-emerald-900/40 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base dark:text-emerald-50"
                                    {...register('email', { required: true })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/70 dark:text-emerald-200 ml-1">Şifre Oluşturun</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-12 pl-12 pr-4 rounded-xl border-border bg-muted dark:bg-emerald-900/40 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base dark:text-emerald-50"
                                    {...register('password', { required: true, minLength: 6 })}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Hesabınız Hazırlanıyor...
                                </>
                            ) : (
                                <>
                                    Hesabı Oluştur
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="pt-6 text-center">
                        <p className="text-muted-foreground dark:text-emerald-300/60 font-medium">
                            Zaten hesabınız var mı?{' '}
                            <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-black hover:underline underline-offset-4">Giriş Yap</Link>
                        </p>
                    </div>

                    <div className="pt-8 border-t border-border dark:border-emerald-900">
                        <p className="text-center text-xs text-muted-foreground dark:text-emerald-400/50 leading-relaxed">
                            Kaydolarak <span className="underline cursor-pointer">Kullanım Koşulları</span> ve <span className="underline cursor-pointer">KVKK Aydınlatma Metni</span>'ni kabul etmiş olursunuz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

