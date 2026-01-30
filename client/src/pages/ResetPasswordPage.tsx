import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const password = watch('password');

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            const rawApiUrl = import.meta.env.VITE_API_URL || '';
            const apiUrl = rawApiUrl.replace(/\/$/, '');
            const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password: data.password
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || 'Sıfırlama işlemi başarısız');
                setIsLoading(false);
                return;
            }

            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError('Bağlantı hatası oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-gradient-to-br from-background via-muted/20 to-background">
            <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                        <ShieldCheck className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Yeni Şifre Oluştur</h1>
                    <p className="text-muted-foreground">Lütfen yeni ve güvenli bir şifre belirleyin.</p>
                </div>

                {isSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Şifre Değiştirildi!</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-black/5 space-y-6">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/70 ml-1">Yeni Şifre</label>
                                    <div className="relative group">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            className="h-12 px-4 rounded-xl border-border bg-muted focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base"
                                            {...register('password', {
                                                required: 'Yeni şifre gereklidir',
                                                minLength: { value: 6, message: 'En az 6 karakter olmalıdır' }
                                            })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-destructive ml-1">{errors.password.message as string}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/70 ml-1">Şifre Tekrar</label>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        className="h-12 px-4 rounded-xl border-border bg-muted focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base"
                                        {...register('confirmPassword', {
                                            required: 'Şifre tekrarı gereklidir',
                                            validate: (val: string) => val === password || 'Şifreler eşleşmiyor'
                                        })}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-xs text-destructive ml-1">{errors.confirmPassword.message as string}</p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 flex items-center gap-3 animate-in shake duration-300">
                                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
