import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, Plus, ChevronDown, Building2, Users, TrendingUp, CheckSquare, AlertTriangle, LogOut, Settings as SettingsIcon, Menu } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import CreateCancellationModal from './CreateCancellationModal';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [pageTitle, setPageTitle] = useState('Dashboard');
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));

        const titles: Record<string, string> = {
            '/dashboard': 'Genel Bakış',
            '/dashboard/sales': 'Satış Analizi',
            '/dashboard/cancellations': 'İptal Analizi',
            '/policy-types': 'Branş Yönetimi',
            '/users': 'Sistem Kullanıcıları',
            '/sales': 'Satış & Portföy',
            '/commissions': 'Varsayılan Oranlar',
            '/tasks': 'Görev & Ajanda',
            '/analytics': 'Gelişmiş Analiz',
            '/commission-rules': 'Komisyon Motoru',
            '/messaging': 'İç İletişim & Mesajlar',
            '/audit': 'Sistem Günlükleri',
            '/settings': 'Ayarlar'
        };
        setPageTitle(titles[location.pathname] || 'ZenithCRM');
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 60000); // 1 minute
        return () => clearInterval(interval);
    }, [location.pathname]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await axios.get('/api/notifications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotifications(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const menuActions = user?.role === 'EMPLOYEE'
        ? [
            { label: 'Yeni Satış', icon: TrendingUp, path: '/sales' },
            { label: 'Yeni Görev', icon: CheckSquare, path: '/tasks' },
            { label: 'Yeni İptal', icon: AlertTriangle, onClick: () => setIsCancelModalOpen(true) }
        ]
        : [
            { label: 'Yeni Şube', icon: Building2, path: '/branches' },
            { label: 'Yeni Personel', icon: Users, path: '/users' },
            { label: 'Yeni Satış', icon: TrendingUp, path: '/sales' },
            { label: 'Yeni İptal', icon: AlertTriangle, onClick: () => setIsCancelModalOpen(true) }
        ];

    return (
        <div className="flex h-screen bg-gray-50/50 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Nav */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-900 lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate max-w-[150px] md:max-w-none">{pageTitle}</h2>
                            <p className="hidden md:block text-xs text-gray-500 font-medium tracking-wide">Yönetim Paneli / {location.pathname.substring(1).split('/')[0]}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-8">
                        {/* Search Bar */}
                        <div className="hidden xl:flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl w-80 group focus-within:bg-white focus-within:border-emerald-200 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all duration-300">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Müşteri, poliçe veya görev ara..."
                                className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 border-l border-1 border-gray-100 pl-4 md:pl-8">
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="h-9 md:h-10 px-3 md:px-4 bg-emerald-600 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
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
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
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
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600">
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
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                        className={`relative p-2.5 rounded-xl transition-all ${isNotificationOpen ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                    >
                                        <Bell className="h-5 w-5" />
                                        {notifications.length > 0 && (
                                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-400 border-2 border-white rounded-full"></span>
                                        )}
                                    </button>

                                    {isNotificationOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-gray-900">Bildirimler</h4>
                                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                                                        {notifications.length} Yeni
                                                    </span>
                                                </div>
                                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                                    {notifications.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                                <Bell className="h-6 w-6 text-gray-300" />
                                                            </div>
                                                            <p className="text-xs text-gray-400 font-medium">Herhangi bir bildirim yok</p>
                                                        </div>
                                                    ) : (
                                                        notifications.map((notif) => (
                                                            <button
                                                                key={notif.id}
                                                                onClick={() => {
                                                                    navigate(notif.link);
                                                                    setIsNotificationOpen(false);
                                                                }}
                                                                className="w-full text-left p-4 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 flex gap-3 group"
                                                            >
                                                                <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${notif.priority === 'HIGH' ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{notif.title}</p>
                                                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
                                                                    <p className="text-[9px] text-gray-400 font-bold mt-1.5">{format(new Date(notif.date), 'd MMMM HH:mm', { locale: tr })}</p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                                <div className="p-2 border-t border-gray-50">
                                                    <button
                                                        onClick={() => {
                                                            navigate('/tasks');
                                                            setIsNotificationOpen(false);
                                                        }}
                                                        className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-all text-center uppercase tracking-widest"
                                                    >
                                                        Tümünü Gör
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="relative group">
                                    <div
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        className="flex items-center gap-3 ml-4 p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer transition-all border border-transparent hover:border-gray-200"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="hidden lg:block text-left">
                                            <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{user?.role === 'ADMIN' ? 'Sistem Yöneticisi' : user?.role}</p>
                                        </div>
                                        <ChevronDown size={14} className={`text-gray-400 ml-1 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {isProfileMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    onClick={() => {
                                                        navigate('/settings');
                                                        setIsProfileMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-emerald-600 transition-all"
                                                >
                                                    <SettingsIcon size={16} className="text-gray-400" />
                                                    Ayarlar
                                                </button>
                                                <div className="h-px bg-gray-50 my-1 mx-2"></div>
                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem('token');
                                                        localStorage.removeItem('user');
                                                        window.location.href = '/login';
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
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
        </div>
    );
}
