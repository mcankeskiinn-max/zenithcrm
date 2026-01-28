import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    Building2,
    ArrowRightLeft,
    CheckSquare,
    Activity,
    LogOut,
    ShieldCheck,
    Settings,
    TrendingUp,
    AlertTriangle,
    MessageSquare,
    ShieldAlert,
    X
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Genel Bakış', path: '/dashboard', section: 'DASHBOARD' },
    { icon: TrendingUp, label: 'Satış Analizi', path: '/dashboard/sales', section: 'DASHBOARD' },
    { icon: AlertTriangle, label: 'İptal Analizi', path: '/dashboard/cancellations', section: 'DASHBOARD' },
    { icon: FileText, label: 'Portföy Yönetimi', path: '/sales', section: 'MENÜ' },
    { icon: Activity, label: 'Gelişmiş Analiz', path: '/analytics', section: 'MENÜ' },
    { icon: CheckSquare, label: 'Görevler', path: '/tasks', section: 'MENÜ' },
    { icon: MessageSquare, label: 'Mesajlar', path: '/messaging', section: 'MENÜ' },
    { icon: Users, label: 'Personel', path: '/users', section: 'YÖNETİM' },
    { icon: Building2, label: 'Şube Yönetimi', path: '/branches', section: 'YÖNETİM' },
    { icon: ArrowRightLeft, label: 'Branş Yönetimi', path: '/policy-types', section: 'YÖNETİM' },
    { icon: ShieldAlert, label: 'Sistem Günlükleri', path: '/audit', section: 'YÖNETİM' },
    { icon: ShieldCheck, label: 'Varsayılan Oranlar', path: '/commissions', section: 'FİNANS' },
    { icon: ShieldCheck, label: 'Komisyon Motoru', path: '/commission-rules', section: 'FİNANS' },
];

const generalItems = [
    { icon: Settings, label: 'Ayarlar', path: '/settings' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const filteredMenuItems = menuItems.filter(item => {
        if (!user || !user.role) return false;
        if (user.role === 'EMPLOYEE') {
            return ['Genel Bakış', 'Satış Analizi', 'İptal Analizi', 'Portföy Yönetimi', 'Görevler', 'Mesajlar'].includes(item.label);
        }
        return true;
    });

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <div className={cn(
                "fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-2xl lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200 overflow-hidden">
                            <img src="/logo.png" alt="ZenithCRM" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">ZenithCRM</h1>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pro Dashboard</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-900 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-8">
                    {['DASHBOARD', 'MENÜ', 'YÖNETİM', 'FİNANS'].map(section => {
                        const items = filteredMenuItems.filter(i => i.section === section);
                        if (items.length === 0) return null;

                        return (
                            <div key={section} className="space-y-2">
                                <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">{section}</h3>
                                <div className="space-y-1">
                                    {items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname.startsWith(item.path);

                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => {
                                                    if (window.innerWidth < 1024) onClose();
                                                }}
                                                className={cn(
                                                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                                                    isActive
                                                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600")} />
                                                    {item.label}
                                                </div>
                                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-sm" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <div className="space-y-2 pt-4 border-t border-gray-50">
                        <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">GENEL</h3>
                        <div className="space-y-1">
                            {generalItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => {
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                        className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300"
                                    >
                                        <Icon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50/50">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate lowercase italic">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
