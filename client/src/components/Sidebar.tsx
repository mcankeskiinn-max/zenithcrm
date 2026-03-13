import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import axios from 'axios';
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
    Scale,
    ClipboardCheck,
    CalendarClock,
    BarChart3,
    Sparkles,
    X
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Genel Bakış', path: '/app/dashboard', section: 'DASHBOARD' },
    { icon: TrendingUp, label: 'Satış Analizi', path: '/app/dashboard/sales', section: 'DASHBOARD' },
    { icon: AlertTriangle, label: 'İptal Analizi', path: '/app/dashboard/cancellations', section: 'DASHBOARD' },
    { icon: BarChart3, label: 'Şube KPI', path: '/app/kpi', section: 'DASHBOARD' },
    { icon: FileText, label: 'Portföy Yönetimi', path: '/app/sales', section: 'MENÜ' },
    { icon: Users, label: 'Müşteriler', path: '/app/customers', section: 'MENÜ' },
    { icon: CalendarClock, label: 'Yenilemeler', path: '/app/renewals', section: 'MENÜ' },
    { icon: Activity, label: 'Gelişmiş Analiz', path: '/app/analytics', section: 'MENÜ' },
    { icon: Scale, label: 'Teklif Karşılaştırma', path: '/app/quotes/compare', section: 'MENÜ' },
    { icon: CheckSquare, label: 'Görevler', path: '/app/tasks', section: 'MENÜ' },
    { icon: MessageSquare, label: 'Mesajlar', path: '/app/messaging', section: 'MENÜ' },
    { icon: Sparkles, label: 'AI Asistan', path: '/app/ai-assistant', section: 'MENÜ' },
    { icon: ClipboardCheck, label: 'Onaylar', path: '/app/approvals', section: 'YÖNETİM' },
    { icon: Users, label: 'Personel', path: '/app/users', section: 'YÖNETİM' },
    { icon: Building2, label: 'Şube Yönetimi', path: '/app/branches', section: 'YÖNETİM' },
    { icon: ArrowRightLeft, label: 'Branş Yönetimi', path: '/app/policy-types', section: 'YÖNETİM' },
    { icon: ShieldAlert, label: 'Sistem Günlükleri', path: '/app/audit', section: 'YÖNETİM' },
    { icon: ShieldCheck, label: 'Varsayılan Oranlar', path: '/app/commissions', section: 'FİNANS' },
    { icon: ShieldCheck, label: 'Komisyon Motoru', path: '/app/commission-rules', section: 'FİNANS' },
    { icon: FileText, label: 'Bordro / Finans', path: '/app/payroll', section: 'FİNANS' },
];

const generalItems = [
    { icon: Settings, label: 'Ayarlar', path: '/app/settings' },
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
            const parsedUser = JSON.parse(userStr);
            console.log('Sidebar User Check:', parsedUser);
            console.log('Tenant isSingleBranch:', parsedUser.tenant?.isSingleBranch);
            setUser(parsedUser);
        }
    }, []);

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

    const filteredMenuItems = menuItems.filter(item => {
        if (!user || !user.role) return false;
        if (user.role === 'EMPLOYEE') {
            return ['Genel Bakış', 'Satış Analizi', 'İptal Analizi', 'Portföy Yönetimi', 'Müşteriler', 'Görevler', 'Mesajlar', 'AI Asistan'].includes(item.label);
        }
        if (user.role === 'MANAGER') {
            return !['Sistem Günlükleri'].includes(item.label);
        }
        if (user.tenant?.isSingleBranch && item.label === 'Şube Yönetimi') {
            return false;
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
                "fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-2xl lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 overflow-hidden border border-border">
                            {user?.tenant?.logo ? (
                                <img src={user.tenant.logo} alt={user.tenant.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={24} />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-base font-bold tracking-tight text-foreground leading-tight">
                                {user?.tenant?.name || 'ZenithCRM'}
                            </h1>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                                Powered by ZenithCRM
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-muted-foreground hover:text-foreground lg:hidden"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-8">
                    {['DASHBOARD', 'MENÜ', 'YÖNETİM', 'FİNANS'].map(section => {
                        const items = filteredMenuItems.filter(i => i.section === section);
                        if (items.length === 0) return null;

                        return (
                            <div key={section} className="space-y-2">
                                <h3 className="px-4 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4">{section}</h3>
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
                                                        ? "bg-primary/10 text-primary shadow-sm"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary/60" : "text-muted-foreground/40 group-hover:text-foreground")} />
                                                    {item.label}
                                                </div>
                                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <div className="space-y-2 pt-4 border-t border-border/50">
                        <h3 className="px-4 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4">GENEL</h3>
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
                                        className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300"
                                    >
                                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-muted/30">
                    <div className="bg-card rounded-2xl p-4 border border-border shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate lowercase italic">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                handleLogout();
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
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


