import React from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    TrendingUp,
    Users,
    Zap,
    ArrowRight,
    PieChart,
    FileText,
    CheckCircle2,
    MousePointerClick,
    Sun,
    Moon,
    Globe,
    Plus,
    Minus,
    Bell,
    Smartphone,
    Bot,
    Cpu,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [openFaq, setOpenFaq] = React.useState<number | null>(null);
    const [currentPage, setCurrentPage] = React.useState(0);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const FEATURES = [

        {
            icon: <Zap className="w-8 h-8 text-emerald-600" />,
            title: "HÄ±z ve Verimlilik",
            description: "OCR teknolojisi ile poliÃ§e bilgilerini otomatik okur ve manuel hatayÄ± sÄ±fÄ±ra indirir."
        },
        {
            icon: <Globe className="w-8 h-8 text-emerald-600" />,
            title: "Whitelabel ArayÃ¼z",
            description: "Kendi logonuzu ve iÅŸletme adÄ±nÄ±zÄ± sisteme ekleyin. Acentenize Ã¶zel bir deneyim yaÅŸatÄ±n."
        },
        {
            icon: <Shield className="w-8 h-8 text-emerald-600" />,
            title: "Tam Veri Ä°zolasyonu",
            description: "Multi-tenant altyapÄ±mÄ±z ile verileriniz diÄŸer acentelerden tamamen izole ve gÃ¼vendedir."
        },
        {
            icon: <PieChart className="w-8 h-8 text-emerald-600" />,
            title: "Derin Analitik",
            description: "SatÄ±ÅŸlarÄ±nÄ±zÄ±, iptallerinizi ve kÃ¢r marjÄ±nÄ±zÄ± gerÃ§ek zamanlÄ± interaktif grafiklerle izleyin."
        },
        {
            icon: <Users className="w-8 h-8 text-emerald-600" />,
            title: "MÃ¼ÅŸteri 360",
            description: "Her mÃ¼ÅŸterinin geÃ§miÅŸini, poliÃ§elerini ve randevularÄ±nÄ± tek bir ekrandan yÃ¶netin."
        },
        {
            icon: <Bell className="w-8 h-8 text-emerald-600" />,
            title: "AkÄ±llÄ± Bildirimler",
            description: "PoliÃ§e yenilemeleri, gÃ¶rev deadlinelarÄ± ve mÃ¼ÅŸteri doÄŸum gÃ¼nleri iÃ§in otomatik hatÄ±rlatmalar alÄ±n."
        },
        {
            icon: <Smartphone className="w-8 h-8 text-emerald-600" />,
            title: "Mobil Ä°letiÅŸim",
            description: "WhatsApp, SMS ve arama iÃ§in tek tÄ±kla eriÅŸim. QR kod ile masaÃ¼stÃ¼nden mobil cihaza geÃ§iÅŸ."
        },
        {
            icon: <Bot className="w-8 h-8 text-emerald-600" />,
            title: "AI Teknik Destek",
            description: "Sistemi tanÄ±yan akÄ±llÄ± asistan ile teknik sorunlarÄ±nÄ±za anÄ±nda Ã§Ã¶zÃ¼m hazÄ±rlayÄ±n."
        },
        {
            icon: <Cpu className="w-8 h-8 text-emerald-600" />,
            title: "HÄ±zlÄ± Kurulum",
            description: "Self-servis kayÄ±t olun ve acentenizin branÅŸlarÄ±nÄ± saniyeler iÃ§inde otomatik yapÄ±landÄ±rÄ±n."
        },        {
            icon: <Shield className="w-8 h-8 text-emerald-600" />,
            title: "Guvenlik ve Izleme",
            description: "Tenant izolasyonu, audit logging ve Sentry izleme ile verileriniz her an kontrol altinda."
        }
    ];

    const totalPages = Math.ceil(FEATURES.length / 3);
    const visibleFeatures = FEATURES.slice(currentPage * 3, (currentPage * 3) + 3);
        const PRICING_PLANS = [
        {
            name: 'Starter',
            description: 'Baslangic icin gerekli temel operasyon araclari.',
            price: '₺899',
            period: 'TRY / ay',
            cta: 'Ucretsiz denemeyi baslat',
            href: '/register',
            features: [
                { label: 'Musteri ve police yonetimi', enabled: true },
                { label: 'Gorev ve yenileme takibi', enabled: true },
                { label: 'Temel raporlama', enabled: true },
                { label: 'Gelismis otomasyon kurallari', enabled: false },
                { label: 'Oncelikli destek', enabled: false },
                { label: 'Kurumsal entegrasyonlar', enabled: false }
            ]
        },
        {
            name: 'Growth',
            description: 'Buyuyen ekipler icin daha guclu kontrol paketi.',
            price: '₺1.790',
            period: 'TRY / ay',
            cta: 'Ucretsiz denemeyi baslat',
            href: '/register',
            features: [
                { label: 'Starter paketindeki tum ozellikler', enabled: true },
                { label: 'Satis ve yenileme otomasyonlari', enabled: true },
                { label: 'Detayli performans analizleri', enabled: true },
                { label: 'Yetki bazli ekip yonetimi', enabled: true },
                { label: 'Oncelikli destek', enabled: false },
                { label: 'Ozel entegrasyon gelistirmeleri', enabled: false }
            ]
        },
        {
            name: 'Scale',
            description: 'Yuksek hacim ve cok sube icin kurumsal esneklik.',
            price: 'Ozel',
            period: 'Ekibimizle iletisime gecin',
            cta: 'Ekibimizle iletisime gecin',
            href: 'mailto:destek@zenithcrm.com',
            features: [
                { label: 'Growth paketindeki tum ozellikler', enabled: true },
                { label: 'Sinirsiz ekip ve sube destegi', enabled: true },
                { label: 'Ozel KPI ve dashboard setleri', enabled: true },
                { label: 'API ve gelismis entegrasyon', enabled: true },
                { label: 'Oncelikli destek ve onboarding', enabled: true },
                { label: 'Kurumsal sozlesme secenekleri', enabled: true }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-emerald-950 text-emerald-950 dark:text-emerald-50 font-sans selection:bg-emerald-100 dark:selection:bg-emerald-800 relative transition-colors duration-500">
            {/* Grain/Noise Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] bg-noise" />
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 dark:bg-emerald-950/80 backdrop-blur-md z-50 border-b border-emerald-100 dark:border-emerald-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-600 p-1.5 rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">
                                ZenithCRM
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            <a href="#features" className="text-emerald-900/60 dark:text-emerald-400 hover:text-emerald-600 transition-colors">Ã–zellikler</a>
                            <a href="#about" className="text-emerald-900/60 dark:text-emerald-400 hover:text-emerald-600 transition-colors">HakkÄ±mÄ±zda</a>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-all border border-emerald-100 dark:border-emerald-800"
                            >
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>

                            <Link
                                to="/login"
                                className="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-700 transition-colors"
                            >
                                GiriÅŸ Yap
                            </Link>

                            <Link
                                to="/register"
                                className="bg-emerald-600 text-white px-5 py-2 rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
                            >
                                Ãœcretsiz KayÄ±t Ol
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 overflow-hidden bg-mesh">
                <div className="max-w-7xl mx-auto text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-50 dark:bg-emerald-600/10 rounded-full blur-3xl -z-10 opacity-50" />

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-8 animate-fade-in border border-emerald-100 dark:border-emerald-800">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Yeni Nesil Sigorta YÃ¶netim Sistemi
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-emerald-950 dark:text-white tracking-tight leading-[1.1] mb-6">
                        Acenteniz Ä°Ã§in <span className="text-emerald-600 dark:text-emerald-500">Ã–zelleÅŸtirilebilir</span> <br className="hidden md:block" /> AkÄ±llÄ± YÃ¶netim Paneli
                    </h1>

                    <p className="text-lg md:text-xl text-emerald-900/60 dark:text-emerald-100/80 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Manuel veri giriÅŸinden kurtulun. AI destekli tahminleme, otomatik poliÃ§e takibi ve
                        geliÅŸmiÅŸ analitik araÃ§larÄ±yla kÃ¢rÄ±nÄ±zÄ± maximize edin.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/register"
                            className="btn-premium bg-emerald-600 text-white shadow-xl shadow-emerald-200"
                        >
                            Ãœcretsiz KayÄ±t Ol
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/login"
                            className="btn-premium bg-white dark:bg-emerald-900 text-emerald-700 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 hover:text-emerald-600 shadow-sm"
                        >
                            Hemen BaÅŸla
                        </Link>
                    </div>

                    <div className="mt-16 bg-emerald-100/30 dark:bg-emerald-900/30 rounded-2xl p-2 shadow-2xl relative animate-float border border-emerald-100/50 dark:border-emerald-800/50 overflow-hidden">
                        <div className="bg-white dark:bg-emerald-950 rounded-xl overflow-hidden h-[400px] md:h-[600px] relative group/mockup">
                            <img
                                src="/assets/zenith-dashboard.png"
                                alt="ZenithCRM Dashboard"
                                className="absolute w-full top-0 left-0 transition-transform duration-500 animate-mockup-scroll group-hover/mockup:[animation-play-state:paused]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl hidden md:flex items-center gap-4 animate-bounce-slow">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-700/70 uppercase font-bold tracking-wider">AylÄ±k BÃ¼yÃ¼me</p>
                                <p className="text-xl font-black text-emerald-950">+42%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-emerald-50/30 dark:bg-emerald-900/10 border-y border-emerald-100/50 dark:border-emerald-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-emerald-600 dark:text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">MÃ¼kemmel Ã–zellikler</h2>
                        <p className="text-3xl md:text-5xl font-black text-emerald-950 dark:text-white">Neden ZenithCRM?</p>
                    </div>

                    <div className="relative group/carousel">
                        <div
                            key={currentPage}
                            className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
                        >
                            {visibleFeatures.map((feature, idx) => (
                                <FeatureCard
                                    key={idx}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            ))}
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <button
                                onClick={() => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)}
                                className="p-3 rounded-full bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-all shadow-sm group/btn"
                                aria-label="Ã–nceki Sayfa"
                            >
                                <ChevronLeft className="w-6 h-6 group-hover/btn:-translate-x-0.5 transition-transform" />
                            </button>

                            <div className="flex gap-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentPage === i
                                            ? "bg-emerald-600 w-8"
                                            : "bg-emerald-200 dark:bg-emerald-800 hover:bg-emerald-300 dark:hover:bg-emerald-700"
                                            }`}
                                        aria-label={`Sayfa ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage((prev) => (prev + 1) % totalPages)}
                                className="p-3 rounded-full bg-white dark:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-all shadow-sm group/btn"
                                aria-label="Sonraki Sayfa"
                            >
                                <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-12 bg-white dark:bg-emerald-950 border-y border-emerald-100 dark:border-emerald-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4">
                    <p className="text-center text-emerald-500/60 dark:text-emerald-200/70 text-sm font-bold uppercase tracking-widest mb-8">GÃ¼venilir Ä°ÅŸ OrtaklarÄ±mÄ±z</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Allianz', 'Axa', 'Generali', 'Mapfre', 'Sompo', 'Turkiye'].map((partner) => (
                            <div key={partner} className="text-2xl font-black text-emerald-500/60 dark:text-emerald-400 select-none cursor-default">{partner}</div>
                        ))}
                    </div>
                </div>
            </section>

                        {/* Pricing Section */}
            <section className="relative py-20 px-4 bg-emerald-50/40 dark:bg-emerald-950 overflow-hidden">
                <div className="absolute left-0 right-0 top-[48%] h-32 bg-emerald-950 dark:bg-emerald-900/80" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        <p className="text-emerald-600 dark:text-emerald-500 font-bold tracking-widest uppercase text-sm mb-3">Fiyatlandirma</p>
                        <h2 className="text-2xl md:text-4xl font-black text-emerald-950 dark:text-white">Ekibinize Uygun Plani Secin</h2>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {PRICING_PLANS.map((plan) => (
                            <div
                                key={plan.name}
                                className="rounded-[26px] border border-emerald-100 dark:border-emerald-800 bg-white dark:bg-emerald-900/95 p-6 md:p-7 shadow-[0_10px_24px_rgba(6,95,70,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.32)]"
                            >
                                <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mb-2">{plan.name}</h3>
                                <p className="text-base text-emerald-900/70 dark:text-emerald-100/80 leading-relaxed min-h-[52px]">{plan.description}</p>

                                <div className="mt-7 flex items-end gap-2.5">
                                    <span className="text-5xl md:text-6xl font-black tracking-tight text-emerald-950 dark:text-white">{plan.price}</span>
                                    <span className="text-base md:text-lg text-emerald-900/60 dark:text-emerald-100/70 mb-1.5">{plan.period}</span>
                                </div>

                                {plan.href.startsWith('mailto:') ? (
                                    <a
                                        href={plan.href}
                                        className="inline-flex mt-7 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold px-5 py-3 transition-colors"
                                    >
                                        {plan.cta}
                                    </a>
                                ) : (
                                    <Link
                                        to={plan.href}
                                        className="inline-flex mt-7 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold px-5 py-3 transition-colors"
                                    >
                                        {plan.cta}
                                    </Link>
                                )}

                                <div className="mt-8">
                                    <p className="text-xl font-bold text-emerald-950 dark:text-white mb-4">Paket icerigi:</p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature.label}
                                                className={`flex items-center gap-3 text-base ${feature.enabled
                                                    ? 'text-emerald-900/85 dark:text-emerald-100'
                                                    : 'text-emerald-900/35 dark:text-emerald-200/40'
                                                    }`}
                                            >
                                                <span className="font-bold leading-none text-emerald-700 dark:text-emerald-300">+</span>
                                                <span>{feature.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* How It Works - Section 1 */}
            <section className="py-24 px-4 bg-white dark:bg-emerald-950 bg-mesh transition-colors group">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1">
                            <div className="relative group-hover:scale-[1.02] transition-all duration-700">
                                <div className="absolute -inset-4 bg-emerald-100/50 dark:bg-emerald-800/20 rounded-3xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="bg-emerald-950 dark:bg-black rounded-2xl p-4 shadow-2xl border border-emerald-900/10 dark:border-emerald-800/50 group-hover:shadow-emerald-500/20 group-hover:-translate-y-3 transition-all duration-700">
                                    <div className="bg-emerald-900 dark:bg-emerald-950 rounded-lg p-6 text-white">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-bold">Yeni PoliÃ§e GiriÅŸi</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-4 w-3/4 bg-emerald-800/50 dark:bg-emerald-900/50 rounded animate-pulse" />
                                            <div className="h-4 w-1/2 bg-emerald-800/50 dark:bg-emerald-900/50 rounded animate-pulse" />
                                            <div className="h-4 w-5/6 bg-emerald-500/20 rounded border border-emerald-500/30 dark:border-emerald-500/10 flex items-center px-4 py-6 gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                <span className="text-sm text-emerald-50">PoliÃ§e PDF okundu: Allianz Kasko #1029</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4">Otomasyon</h2>
                            <h3 className="text-4xl font-black text-emerald-950 dark:text-white mb-6">Manuel Veri GiriÅŸine <span className="text-emerald-600 dark:text-emerald-500">Son Verin</span></h3>
                            <p className="text-lg text-emerald-900/60 dark:text-emerald-100/80 mb-8 leading-relaxed">
                                OCR teknolojimiz sayesinde poliÃ§e PDF'lerini saniyeler iÃ§inde tarayÄ±n. MÃ¼ÅŸteri bilgileri, primler ve komisyonlar otomatik olarak sisteme iÅŸlenir. Hata payÄ±nÄ± sÄ±fÄ±ra indirin.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "PDF'den Otomatik Veri Ã‡ekme",
                                    "HatalÄ± Veri Tespiti ve UyarÄ±",
                                    "AnÄ±nda Ä°ÅŸleme ve KayÄ±t"
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-700 dark:text-emerald-100/90 font-medium">
                                        <div className="bg-emerald-100 dark:bg-emerald-800 p-1 rounded-full">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - Section 2 */}
            <section className="py-24 px-4 bg-emerald-50/30 dark:bg-emerald-900/10 border-y border-emerald-100/50 dark:border-emerald-900/50 transition-colors group">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4">MÃ¼ÅŸteri YÃ¶netimi</h2>
                            <h3 className="text-4xl font-black text-emerald-950 dark:text-white mb-6">MÃ¼ÅŸterilerinizi <span className="text-emerald-600 dark:text-emerald-500">TanÄ±yÄ±n</span></h3>
                            <p className="text-lg text-emerald-900/60 dark:text-emerald-100/80 mb-8 leading-relaxed">
                                Her mÃ¼ÅŸterinin tÃ¼m poliÃ§e geÃ§miÅŸini, iletiÅŸim detaylarÄ±nÄ± ve gelecekteki potansiyel ihtiyaÃ§larÄ±nÄ± tek bir merkezden gÃ¶rÃ¼n. KampanyalarÄ±nÄ±zÄ± kiÅŸiye Ã¶zel kurgulayÄ±n.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-emerald-900 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800">
                                    <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                                    <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">360Â° GÃ¶rÃ¼nÃ¼m</p>
                                </div>
                                <div className="bg-white dark:bg-emerald-900 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800">
                                    <MousePointerClick className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                                    <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Tek TÄ±kla EriÅŸim</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative group-hover:scale-[1.02] transition-all duration-700">
                            <div className="absolute -inset-4 bg-emerald-600/10 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="bg-white dark:bg-emerald-900 rounded-2xl shadow-2xl p-6 border border-emerald-100 dark:border-emerald-800 group-hover:shadow-emerald-500/10 group-hover:-translate-y-3 transition-all duration-700">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-emerald-100/30 dark:bg-emerald-800/30 rounded-full" />
                                        <div>
                                            <p className="font-bold text-emerald-950 dark:text-emerald-50 text-lg">Ahmet YÄ±lmaz</p>
                                            <p className="text-sm text-emerald-700/70 dark:text-emerald-400">Mevcut PoliÃ§eler: 3</p>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black px-2 py-1 rounded">VÄ°P</div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm p-3 bg-emerald-50/30 dark:bg-emerald-950 rounded-lg dark:text-emerald-300">
                                        <span>Kasko</span>
                                        <span className="font-bold">Aktif</span>
                                    </div>
                                    <div className="flex justify-between text-sm p-3 bg-emerald-50/30 dark:bg-emerald-950 rounded-lg dark:text-emerald-300">
                                        <span>Konut</span>
                                        <span className="font-bold">Aktif</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* How It Works - Section 3 */}
            <section className="py-24 px-4 bg-white dark:bg-emerald-950 bg-mesh transition-colors group">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1">
                            <div className="relative group-hover:scale-[1.02] transition-all duration-700">
                                <div className="absolute -inset-4 bg-orange-100/50 dark:bg-orange-800/20 rounded-3xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-xl group-hover:shadow-orange-500/10 group-hover:-translate-y-3 transition-all duration-700">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-orange-950 dark:text-orange-50">Keskin Sigorta</p>
                                            <p className="text-xs text-orange-600 font-bold">Acente Paneli</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                                            <div className="w-10 h-10 rounded-sm bg-muted overflow-hidden">
                                                <img src="https://api.dicebear.com/7.x/initials/svg?seed=KS" alt="Logo" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-sm font-bold text-orange-900 dark:text-orange-100">Ã–zel Logo & Kurumsal Renk</span>
                                        </div>
                                        <div className="h-2 w-full bg-orange-100 dark:bg-orange-900/50 rounded-full overflow-hidden">
                                            <div className="h-full w-2/3 bg-orange-500 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <h2 className="text-orange-600 font-bold uppercase tracking-widest text-sm mb-4">Branding & Ä°zolasyon</h2>
                            <h3 className="text-4xl font-black text-emerald-950 dark:text-white mb-6">Kendi <span className="text-orange-600">MarkanÄ±zÄ±</span> Ã–ne Ã‡Ä±karÄ±n</h3>
                            <p className="text-lg text-emerald-900/60 dark:text-emerald-100/80 mb-8 leading-relaxed">
                                ZenithCRM'i bir kiralÄ±k yazÄ±lÄ±m gibi deÄŸil, kendi acente yazÄ±lÄ±mÄ±nÄ±z gibi kullanÄ±n. Logonuzu yÃ¼kleyin, iÅŸletme adÄ±nÄ±zÄ± belirleyin. Multi-tenant altyapÄ±mÄ±z sayesinde her acente kendi Ã¶zel ve izole dÃ¼nyasÄ±nda Ã§alÄ±ÅŸÄ±r.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <span className="px-4 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-black rounded-full border border-orange-100 dark:border-orange-800">LOGO Ã–ZELLEÅTÄ°RME</span>
                                <span className="px-4 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-black rounded-full border border-orange-100 dark:border-orange-800">MARKA YÃ–NETÄ°MÄ°</span>
                                <span className="px-4 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-black rounded-full border border-orange-100 dark:border-orange-800">TAM VERÄ° GÃœVENLÄ°ÄÄ°</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-emerald-950 text-emerald-50 relative overflow-hidden">
                <div className="absolute -top-24 right-0 w-72 h-72 bg-emerald-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px]" />

                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <p className="text-2xl md:text-4xl font-black text-white">
                            YÃ¼ksek gÃ¼venlik kontrolleri ile pilot boyunca verileriniz koruma altÄ±nda.
                        </p>
                        <p className="text-emerald-200/70 max-w-3xl mx-auto mt-4">
                            Sorun yaÅŸadÄ±ÄŸÄ±nÄ±zda anÄ±nda AI destekli teknik destek ile yanÄ±nÄ±zdayÄ±z.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-2xl p-6">
                            <h3 className="text-xl font-black text-white mb-3">Acentenizin Verileri Kontrol AltÄ±nda</h3>
                            <p className="text-emerald-200/70">Ekranda sadece sizin acentenize ait veriler gÃ¶rÃ¼nÃ¼r.</p>
                        </div>
                        <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-2xl p-6">
                            <h3 className="text-xl font-black text-white mb-3">GÃ¼venli GiriÅŸ</h3>
                            <p className="text-emerald-200/70">Yetkisiz giriÅŸ denemeleri otomatik olarak engellenir.</p>
                        </div>
                        <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-2xl p-6">
                            <h3 className="text-xl font-black text-white mb-3">AnÄ±nda Destek</h3>
                            <p className="text-emerald-200/70">Sorun yaÅŸadÄ±ÄŸÄ±nÄ±zda teknik ekip ve AI destek hemen devreye girer.</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* FAQ Section */}
            <section className="py-24 bg-white dark:bg-emerald-950 bg-mesh transition-colors">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-emerald-600 dark:text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">Destek</h2>
                        <p className="text-3xl md:text-5xl font-black text-emerald-950 dark:text-white">Merak Edilenler</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "ZenithCRM verilerimizi nerede saklÄ±yor?",
                                a: "TÃ¼m verileriniz endÃ¼stri standartlarÄ±nda ÅŸifrelenmiÅŸ olarak gÃ¼venli sunucularÄ±mÄ±zda saklanÄ±r. Supabase altyapÄ±sÄ± ile banka seviyesinde gÃ¼venlik saÄŸlÄ±yoruz."
                            },
                            {
                                q: "Mevcut verilerimizi sisteme aktarabilir miyiz?",
                                a: "Evet! Excel veya CSV formatÄ±ndaki verilerinizi tek tÄ±kla sisteme aktarabilirsiniz. Destek ekibimiz bu sÃ¼reÃ§te size Ã¼cretsiz yardÄ±mcÄ± olacaktÄ±r."
                            },
                            {
                                q: "KullanÄ±m iÃ§in teknik bilgi gerekiyor mu?",
                                a: "HayÄ±r. ZenithCRM, herkesin kullanabileceÄŸi kadar basit bir arayÃ¼zle tasarlanmÄ±ÅŸtÄ±r. Ortalama 15 dakikalÄ±k bir eÄŸitimle tÃ¼m Ã¶zellikleri kullanmaya baÅŸlayabilirsiniz."
                            },
                            {
                                q: "AylÄ±k Ã¼cret dÄ±ÅŸÄ±nda bir maliyet var mÄ±?",
                                a: "HayÄ±r. Kurulum Ã¼creti, gÃ¼ncelleme Ã¼creti veya gizli maliyetler yoktur. SeÃ§tiÄŸiniz paket dahilinde tÃ¼m Ã¶zelliklere eriÅŸebilirsiniz."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="border border-emerald-100 dark:border-emerald-800 rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-emerald-900/50">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-emerald-50/30 dark:hover:bg-emerald-800/30 transition-colors"
                                >
                                    <span className="text-lg font-bold text-emerald-950 dark:text-emerald-50">{faq.q}</span>
                                    {openFaq === i ? (
                                        <Minus className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-emerald-500/60 dark:text-emerald-500/40" />
                                    )}
                                </button>
                                {openFaq === i && (
                                    <div className="p-6 pt-0 text-emerald-900/60 dark:text-emerald-100/80 leading-relaxed border-t border-emerald-50/10 dark:border-emerald-800 animate-in slide-in-from-top-2 duration-300">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-emerald-700/70 dark:text-emerald-300 mb-6">Hala sorunuz mu var?</p>
                        <a href="#" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline">
                            Destek Ekibimizle KonuÅŸun <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-4">
                <div className="max-w-5xl mx-auto bg-emerald-950 rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px]" />

                    <h2 className="text-4xl md:text-5xl font-black text-white mb-8 relative z-10">
                        Acentenizin GeleceÄŸini <br /> <span className="text-emerald-500">BugÃ¼nden Kurun</span>
                    </h2>
                    <p className="text-emerald-500/60 dark:text-emerald-300/80 text-lg mb-10 max-w-2xl mx-auto relative z-10">
                        ZenithCRM ile verimliliÄŸi artÄ±rÄ±n, kÃ¢rlÄ±lÄ±ÄŸÄ± izleyin ve mÃ¼ÅŸterilerinizle daha gÃ¼Ã§lÃ¼ baÄŸlar kurun.
                    </p>
                    <Link
                        to="/register"
                        className="btn-premium bg-emerald-600 text-white text-xl hover:bg-emerald-700 shadow-2xl shadow-emerald-900/40 relative z-10 dark:shadow-black/50"
                    >
                        Ãœcretsiz HesabÄ±nÄ±zÄ± OluÅŸturun <ArrowRight className="w-6 h-6" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-emerald-950 dark:bg-black py-12 text-emerald-100/60 border-t border-emerald-900 dark:border-emerald-950 transition-colors">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex justify-center items-center gap-2 mb-6">
                        <Shield className="w-8 h-8 text-emerald-500" />
                        <span className="text-2xl font-bold text-white">ZenithCRM</span>
                    </div>
                    <p className="mb-8 dark:text-emerald-500/60">TÃ¼m sigorta sÃ¼reÃ§lerinizi tek merkezden yÃ¶netin.</p>
                    <div className="border-t border-emerald-900 dark:border-emerald-900/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="dark:text-emerald-200/60">Â© 2024 ZenithCRM. TÃ¼m haklarÄ± saklÄ±dÄ±r.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors dark:text-emerald-600">Gizlilik</a>
                            <a href="#" className="hover:text-white transition-colors dark:text-emerald-600">Åartlar</a>
                            <a href="#" className="hover:text-white transition-colors dark:text-emerald-600">Ä°letiÅŸim</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-white dark:bg-emerald-900 p-8 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800 hover:shadow-xl dark:hover:shadow-emerald-900/20 hover:-translate-y-1 transition-all duration-300">
        <div className="mb-6">{icon}</div>
        <h3 className="text-xl font-bold text-emerald-950 dark:text-white mb-3">{title}</h3>
        <p className="text-emerald-900/60 dark:text-emerald-100/90 leading-relaxed">{description}</p>
    </div>
);

export default LandingPage;





