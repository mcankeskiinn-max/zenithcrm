import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const rawApiUrl = import.meta.env.VITE_API_URL || '';
            const apiUrl = rawApiUrl.replace(/\/$/, '');
            const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || 'İşlem başarısız');
                setIsLoading(false);
                return;
            }

            setMessage(json.message || 'Sıfırlama bağlantısı gönderildi.');
            setIsSuccess(true);
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
                        <Mail className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Şifremi Unuttum</h1>
                    <p className="text-muted-foreground">E-posta adresinizi girin, size bir sıfırlama linki gönderelim.</p>
                </div>

                {isSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">E-posta Gönderildi!</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {message}<br />
                                Lütfen gelen kutunuzu (ve gereksiz kutusunu) kontrol edin.
                            </p>
                        </div>
                        <Link to="/login">
                            <Button className="w-full h-12 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                                Giriş Ekranına Dön
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-black/5 space-y-6">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/70 ml-1">E-posta Adresi</label>
                                    <Input
                                        type="email"
                                        placeholder="ornek@firma.com"
                                        className="h-12 px-4 rounded-xl border-border bg-muted focus:border-emerald-500 focus:ring-emerald-500/10 transition-all text-base"
                                        {...register('email', { required: 'E-posta adresi gereklidir' })}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-destructive ml-1">{errors.email.message as string}</p>
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
                                {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                            </Button>
                        </form>

                        <div className="pt-2 text-center">
                            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-emerald-500 transition-colors">
                                <ArrowLeft size={16} />
                                Giriş Ekranına Dön
                            </Link>
                        </div>
                    </div>
                )}

                <div className="text-center text-sm text-muted-foreground/60">
                    © 2026 ZenithCRM. Tüm hakları saklıdır.
                </div>
            </div>
        </div>
    );
}
