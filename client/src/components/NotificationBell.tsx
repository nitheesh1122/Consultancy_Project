import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const NotificationBell = () => {
 const [unreadCount, setUnreadCount] = useState(0);
 const { socket } = useSocket();

 const fetchNotifications = async () => {
 try {
 const { data } = await api.get('/notifications');
 setUnreadCount(data.unreadCount);
 } catch (error) {
 console.error('Failed to fetch notifications');
 }
 };

 useEffect(() => {
 fetchNotifications();

 if (socket) {
 socket.on('notification', () => {
 fetchNotifications();
 // Optional: Show a toast/snackbar here
 });
 }

 return () => {
 if (socket) socket.off('notification');
 };
 }, [socket]);

 return (
 <Link to="/notifications" className="relative p-2 text-secondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-md">
 <Bell className="w-6 h-6" />
 {unreadCount > 0 && (
 <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-status-danger border-2 border-card rounded-full">
 {unreadCount}
 </span>
 )}
 </Link>
 );
};

export default NotificationBell;
