import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, AlertCircle, Gift, TrendingUp, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotificationPanelProps {
    onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
    const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'POLICY_RENEWAL': return <Clock className="text-orange-500" size={20} />;
            case 'TASK_DEADLINE': return <AlertCircle className="text-red-500" size={20} />;
            case 'TASK_ASSIGNED': return <CheckCheck className="text-blue-500" size={20} />;
            case 'CUSTOMER_BIRTHDAY': return <Gift className="text-pink-500" size={20} />;
            case 'COMMISSION_EARNED': return <TrendingUp className="text-green-500" size={20} />;
            case 'SYSTEM_ALERT': return <Info className="text-blue-500" size={20} />;
            default: return <Bell className="text-gray-500" size={20} />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'border-l-4 border-red-500';
            case 'HIGH': return 'border-l-4 border-orange-500';
            case 'NORMAL': return 'border-l-4 border-blue-500';
            case 'LOW': return 'border-l-4 border-gray-300';
            default: return '';
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
        onClose();
    };

    return (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell size={18} />
                    Bildirimler
                </h3>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
                    >
                        <Check size={14} />
                        Tümünü Okundu İşaretle
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto" />
                        <p className="mt-2 text-sm">Yükleniyor...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Bell size={48} className="mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Henüz bildirim yok</p>
                        <p className="text-sm mt-1">Yeni bildirimler burada görünecek</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.isRead ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                                } ${getPriorityColor(notification.priority)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                            {notification.title}
                                        </p>
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                            locale: tr
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500">
                        Toplam {notifications.length} bildirim
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;

