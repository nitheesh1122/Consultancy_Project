import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Shield, Search, Loader2 } from 'lucide-react';

interface AuditLog {
 _id: string;
 action: string;
 userId?: { username: string; role: string };
 ipAddress?: string;
 timestamp: string;
 details?: any;
}

const AdminAudit = () => {
 const [logs, setLogs] = useState<AuditLog[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 fetchLogs();
 }, []);

 const fetchLogs = async () => {
 try {
 const { data } = await api.get('/audit');
 setLogs(data);
 } catch (error) {
 console.error('Failed to fetch audit logs', error);
 } finally {
 setLoading(false);
 }
 };

 const filteredLogs = logs.filter(log =>
 log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
 log.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="max-w-7xl mx-auto pb-12">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2">
 <Shield className="h-6 w-6 text-primary" />
 System Audit Logs
 </h2>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
 <input
 type="text"
 placeholder="Search logs..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
 />
 </div>
 </div>

 <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
 {loading ? (
 <div className="flex justify-center py-12">
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-background">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Timestamp</th>
 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">User</th>
 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Action</th>
 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Details</th>
 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">IP Address</th>
 </tr>
 </thead>
 <tbody className="bg-surface divide-y divide-border">
 {filteredLogs.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-secondary">
 No logs found matching your search.
 </td>
 </tr>
 ) : (
 filteredLogs.map((log) => (
 <tr key={log._id} className="hover:bg-background transition-colors">
 <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
 {new Date(log.timestamp).toLocaleString()}
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <div className="h-8 w-8 rounded-full bg-surface-highlight flex items-center justify-center text-xs font-bold text-secondary mr-3">
 {log.userId?.username?.charAt(0).toUpperCase() || '?'}
 </div>
 <div>
 <div className="text-sm font-medium text-primary">{log.userId?.username || 'System'}</div>
 <div className="text-xs text-secondary">{log.userId?.role || 'SYSTEM'}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/20 text-primary">
 {log.action}
 </span>
 </td>
 <td className="px-6 py-4 text-sm text-secondary max-w-xs truncate">
 {JSON.stringify(log.details)}
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
 {log.ipAddress || '-'}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
};

export default AdminAudit;
