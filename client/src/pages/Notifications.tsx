import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, Check } from 'lucide-react';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark read');
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-5 h-5" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5" />;
            case 'ERROR': return <XCircle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'SUCCESS': return 'border-green-500 text-green-700 bg-green-50';
            case 'WARNING': return 'border-yellow-500 text-yellow-700 bg-yellow-50';
            case 'ERROR': return 'border-red-500 text-red-700 bg-red-50';
            default: return 'border-indigo-500 text-indigo-700 bg-indigo-50';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Notifications...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Bell className="mr-2 h-6 w-6 text-indigo-600" />
                    Your Notifications
                </h2>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={markAllRead}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded"
                    >
                        Mark All as Read
                    </button>
                )}
            </div>

            <div className="grid gap-4">
                {notifications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        No notifications yet.
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif._id}
                            className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${!notif.read ? 'ring-2 ring-indigo-100' : ''} ${getTypeColor(notif.type).split(' ')[0]}`}
                        >
                            <div className="p-4 sm:p-6 flex items-start space-x-4">
                                <div className={`flex-shrink-0 p-2 rounded-full ${getTypeColor(notif.type).replace('border-', '')}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-medium text-gray-900 ${!notif.read ? 'font-bold' : ''}`}>
                                            {notif.type}
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                            {!notif.read && (
                                                <button
                                                    onClick={() => markAsRead(notif._id)}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                                                    title="Mark as Read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
