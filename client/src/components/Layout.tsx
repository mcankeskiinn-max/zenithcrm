import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Plus, ChevronDown, Building2, Users, TrendingUp, CheckSquare, AlertTriangle, LogOut, Settings as SettingsIcon, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import CreateCancellationModal from './CreateCancellationModal';
import NotificationBell from './NotificationBell';
import { SupportWidget } from './SupportWidget';
import axios from 'axios';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [pageTitle, setPageTitle] = useState('Dashboard');
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));

        const titles: Record<string, string> = {
            '/app/dashboard': 'Genel Bakış',
            '/app/dashboard/sales': 'Satış Analizi',
            '/app/dashboard/cancellations': 'İptal Analizi',
            '/app/policy-types': 'Branş Yönetimi',
            '/app/users': 'Sistem Kullanıcıları',
            '/app/sales': 'Satış & Portföy',
            '/app/commissions': 'Varsayılan Oranlar',
            '/app/tasks': 'Görev & Ajanda',
            '/app/analytics': 'Gelişmiş Analiz',
            '/app/commission-rules': 'Komisyon Motoru',
            '/app/messaging': 'İç İletişim & Mesajlar',
            '/app/audit': 'Sistem Günlükleri',
            '/app/settings': 'Ayarlar'
        };
        setPageTitle(titles[location.pathname] || 'ZenithCRM');
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await axios.post('/api/auth/logout', {});
        } catch {
            // ignore logout network errors
        } finally {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };



    const menuActions = user?.role === 'EMPLOYEE'
        ? [
            { label: 'Yeni Satış', icon: TrendingUp, path: '/app/sales' },
            { label: 'Yeni Görev', icon: CheckSquare, path: '/app/tasks' },
            { label: 'Yeni İptal', icon: AlertTriangle, onClick: () => setIsCancelModalOpen(true) }
        ]
        : [
            ...(user?.tenant?.isSingleBranch ? [] : [{ label: 'Yeni Şube', icon: Building2, path: '/app/branches' }]),
            { label: 'Yeni Personel', icon: Users, path: '/app/users' },
            { label: 'Yeni Satış', icon: TrendingUp, path: '/app/sales' },
            { label: 'Yeni İptal', icon: AlertTriangle, onClick: () => setIsCancelModalOpen(true) }
        ];

    return (
        <div className="flex h-screen bg-background overflow-hidden transition-colors duration-300">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Nav */}
                <header className="h-20 bg-card border-b border-border flex items-center justify-between px-4 md:px-8 z-20 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-muted-foreground hover:text-foreground lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-xl font-bold text-foreground truncate max-w-[150px] md:max-w-none">{pageTitle}</h2>
                            <p className="hidden md:block text-xs text-muted-foreground font-medium tracking-wide">Yönetim Paneli / {location.pathname.substring(1).split('/')[0]}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-8">
                        {/* Search Bar */}
                        <div className="hidden xl:flex items-center gap-3 px-4 py-2.5 bg-secondary border border-border rounded-xl w-80 group focus-within:bg-card focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-300">
                            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Müşteri, poliçe veya görev ara..."
                                className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 border-l border-border pl-4 md:pl-8">
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="h-9 md:h-10 px-3 md:px-4 bg-primary text-primary-foreground rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">Yeni Kayıt</span>
                                    <ChevronDown size={14} className={`ml-1 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-2xl border border-border py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                            {menuActions.map((action, idx) => {
                                                const Icon = action.icon;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            if (action.path) navigate(action.path);
                                                            if (action.onClick) action.onClick();
                                                            setIsMenuOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                                                            <Icon size={16} />
                                                        </div>
                                                        {action.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <NotificationBell />

                                <div className="relative group">
                                    <div
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        className="flex items-center gap-3 ml-4 p-1.5 hover:bg-muted rounded-xl cursor-pointer transition-all border border-transparent hover:border-border"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="hidden lg:block text-left">
                                            <p className="text-xs font-bold text-foreground leading-tight">{user?.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">{user?.role === 'ADMIN' ? 'Sistem Yöneticisi' : user?.role}</p>
                                        </div>
                                        <ChevronDown size={14} className={`text-muted-foreground ml-1 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isProfileMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-2xl shadow-2xl border border-border py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    onClick={() => {
                                                        navigate('/app/settings');
                                                        setIsProfileMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                                                >
                                                    <SettingsIcon size={16} className="text-muted-foreground" />
                                                    Ayarlar
                                                </button>
                                                <div className="h-px bg-border my-1 mx-2"></div>
                                                <button
                                                    onClick={() => {
                                                        handleLogout();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
                                                >
                                                    <LogOut size={16} />
                                                    Çıkış Yap
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>

            <CreateCancellationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onSuccess={() => {
                    window.dispatchEvent(new CustomEvent('refresh-dashboard'));
                }}
            />
            <SupportWidget />
        </div>
    );
}

