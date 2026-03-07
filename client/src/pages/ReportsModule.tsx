import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import api from '../lib/api';
import {
    FileText, Download, Mail, Users, Settings,
    Calendar, CheckCircle, XCircle, Plus, Trash2,
    RefreshCw, Clock, AlertCircle, Shield,
    Search, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'generate' | 'recipients' | 'send' | 'config' | 'audit';

interface Recipient {
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}

interface AuditEntry {
    _id: string;
    action: string;
    userId?: { username: string; role: string };
    ipAddress?: string;
    timestamp: string;
    details?: any;
}

interface AuditResponse {
    logs: AuditEntry[];
    total: number;
    page: number;
    pages: number;
}

// ─── Action badge colours ──────────────────────────────────────────────────────
const getActionBadgeClass = (action: string): string => {
    if (['USER_LOGIN', 'USER_REGISTERED'].includes(action))
        return 'bg-status-info/10 text-status-info border-status-info/20';
    if (['MATERIAL_ADDED', 'MRS_CREATED', 'PI_RAISED', 'BATCH_CREATED', 'BATCH_STARTED'].includes(action))
        return 'bg-status-success/10 text-status-success border-status-success/20';
    if (['MATERIAL_UPDATED', 'MRS_ISSUED', 'PI_STATUS_UPDATED', 'INWARD_PROCESSED', 'BATCH_COMPLETED', 'MATERIAL_RETURNED'].includes(action))
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (['MATERIAL_DELETED', 'MRS_REJECTED', 'USER_DELETED'].includes(action))
        return 'bg-status-danger/10 text-status-danger border-status-danger/20';
    return 'bg-brand-light text-brand-primary border-brand-primary/20';
};

const ACTION_MODULE_MAP: Record<string, string> = {
    USER_LOGIN: 'Auth', USER_REGISTERED: 'Auth', USER_DELETED: 'Auth',
    MATERIAL_ADDED: 'Inventory', MATERIAL_UPDATED: 'Inventory', MATERIAL_DELETED: 'Inventory',
    MRS_CREATED: 'Procurement', MRS_ISSUED: 'Procurement', MRS_REJECTED: 'Procurement',
    MATERIAL_RETURNED: 'Procurement', PI_RAISED: 'Procurement',
    PI_STATUS_UPDATED: 'Procurement', INWARD_PROCESSED: 'Procurement',
    BATCH_CREATED: 'Production', BATCH_STARTED: 'Production', BATCH_COMPLETED: 'Production',
};

const ALL_ACTIONS = [
    'ALL', 'USER_LOGIN', 'USER_REGISTERED', 'USER_DELETED',
    'MATERIAL_ADDED', 'MATERIAL_UPDATED', 'MATERIAL_DELETED',
    'MRS_CREATED', 'MRS_ISSUED', 'MRS_REJECTED', 'MATERIAL_RETURNED',
    'PI_RAISED', 'PI_STATUS_UPDATED', 'INWARD_PROCESSED',
    'BATCH_CREATED', 'BATCH_STARTED', 'BATCH_COMPLETED',
];

// ─── Readable details helper ────────────────────────────────────────────────────
function formatDetails(details: any): string {
    if (!details) return '—';
    const parts: string[] = [];
    if (details.username) parts.push(`user: ${details.username}`);
    if (details.role) parts.push(`role: ${details.role}`);
    if (details.params?.id) parts.push(`id: ${details.params.id}`);
    if (details.body && typeof details.body === 'object') {
        const bodyKeys = Object.keys(details.body).slice(0, 3);
        bodyKeys.forEach(k => {
            const val = details.body[k];
            if (val !== undefined && val !== null && typeof val !== 'object')
                parts.push(`${k}: ${val}`);
        });
    }
    if (details.query && typeof details.query === 'object' && Object.keys(details.query).length) {
        const q = Object.entries(details.query).slice(0, 2).map(([k, v]) => `${k}=${v}`).join(', ');
        parts.push(`query: ${q}`);
    }
    return parts.length ? parts.join(' · ') : '—';
}

// ─── Main Component ────────────────────────────────────────────────────────────
const ReportsModule = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('generate');

    // Config State
    const [config, setConfig] = useState<any>(null);
    const [configLoading, setConfigLoading] = useState(false);

    // Recipients State
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [recipientsLoading, setRecipientsLoading] = useState(false);

    // Generate/Send State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [newEmailInput, setNewEmailInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchConfig();
            fetchRecipients();
        }
    }, [user]);

    const fetchConfig = async () => {
        setConfigLoading(true);
        try {
            const { data } = await api.get('/reports/config');
            setConfig(data);
        } catch { toast.error('Failed to load automation config.'); }
        finally { setConfigLoading(false); }
    };

    const fetchRecipients = async () => {
        setRecipientsLoading(true);
        try {
            const { data } = await api.get('/reports/recipients');
            setRecipients(data);
        } catch { toast.error('Failed to load recipients.'); }
        finally { setRecipientsLoading(false); }
    };

    const handleDownload = async () => {
        setActionLoading(true);
        try {
            const response = await api.get(`/reports/generate?startDate=${startDate}&endDate=${endDate}&format=${format}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GTD_System-Operations-Report_${startDate}_to_${endDate}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Report downloaded successfully!');
        } catch { toast.error('Failed to download report.'); }
        finally { setActionLoading(false); }
    };

    const handleSendReport = async () => {
        let emailsToSend = [...selectedEmails];
        if (newEmailInput.trim() && /^\S+@\S+\.\S+$/.test(newEmailInput)) emailsToSend.push(newEmailInput.trim());
        if (emailsToSend.length === 0) { toast.error('Please select or enter at least one email address.'); return; }
        setActionLoading(true);
        try {
            await api.post('/reports/send', { startDate, endDate, format, emails: emailsToSend });
            toast.success('Report dispatched successfully!');
            setNewEmailInput('');
            setSelectedEmails([]);
        } catch { toast.error('Failed to send report.'); }
        finally { setActionLoading(false); }
    };

    const handleToggleConfig = async () => {
        if (!config) return;
        setConfigLoading(true);
        try {
            const { data } = await api.put('/reports/config', { isDailyReportEnabled: !config.isDailyReportEnabled, dailyReportSchedule: config.dailyReportSchedule });
            setConfig(data);
            toast.success(`Daily reports ${data.isDailyReportEnabled ? 'enabled' : 'disabled'}.`);
        } catch { toast.error('Failed to update config.'); }
        finally { setConfigLoading(false); }
    };

    const handleUpdateSchedule = async (newSchedule: string) => {
        if (!config) return;
        setConfigLoading(true);
        try {
            const { data } = await api.put('/reports/config', { isDailyReportEnabled: config.isDailyReportEnabled, dailyReportSchedule: newSchedule });
            setConfig(data);
            toast.success('Schedule updated.');
        } catch { toast.error('Failed to update schedule.'); }
        finally { setConfigLoading(false); }
    };

    if (user?.role !== 'ADMIN') return <Navigate to="/unauthorized" />;

    const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'generate', label: 'Download Report', icon: <Download className="w-4 h-4" /> },
        { id: 'send', label: 'Send Email', icon: <Mail className="w-4 h-4" /> },
        { id: 'recipients', label: 'Recipients', icon: <Users className="w-4 h-4" /> },
        { id: 'config', label: 'Automation', icon: <Settings className="w-4 h-4" /> },
        { id: 'audit', label: 'Audit Logs', icon: <Shield className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary">System Reporting</h1>
                    <p className="text-secondary mt-1 text-sm">Automated reporting, email management, and audit trail.</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto space-x-1 bg-elevated p-1 rounded-xl border border-subtle scrollbar-hide">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-primary text-white shadow-md' : 'text-secondary hover:text-primary hover:bg-canvas'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-card border border-subtle rounded-xl shadow-sm p-6 lg:p-8">

                {/* 1. Download Tab */}
                {activeTab === 'generate' && (
                    <div className="max-w-3xl space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-bold text-primary font-heading mb-2">Generate System Report</h2>
                            <p className="text-sm text-secondary">Select a date range to generate a comprehensive system activity report including audit log insights.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-subtle rounded-lg text-sm text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-subtle rounded-lg text-sm text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-primary">Report Format</label>
                            <div className="flex gap-4">
                                {(['pdf', 'csv'] as const).map(f => (
                                    <label key={f} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${format === f ? 'border-brand-primary bg-brand-light' : 'border-subtle hover:bg-elevated'}`}>
                                        <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} className="accent-brand-primary h-4 w-4" />
                                        <div>
                                            <p className="font-semibold text-primary text-sm">{f.toUpperCase()} {f === 'pdf' ? 'Document' : 'Spreadsheet'}</p>
                                            <p className="text-xs text-secondary mt-0.5">{f === 'pdf' ? 'Presentation ready' : 'Raw data format'}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-subtle">
                            <button onClick={handleDownload} disabled={actionLoading} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-canvas font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Download {format.toUpperCase()}
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Send Email Tab */}
                {activeTab === 'send' && (
                    <div className="max-w-3xl space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-bold text-primary font-heading mb-2">Dispatch Report via Email</h2>
                            <p className="text-sm text-secondary">Generate and send reports directly to recipients.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-elevated p-6 rounded-xl border border-subtle">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Start Date</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-subtle rounded-lg bg-canvas text-sm focus:border-brand-primary" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">End Date</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-subtle rounded-lg bg-canvas text-sm focus:border-brand-primary" />
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-sm font-semibold text-primary">Attachment Format</label>
                                <select value={format} onChange={(e: any) => setFormat(e.target.value)} className="w-full px-4 py-2 border border-subtle rounded-lg bg-canvas text-sm focus:border-brand-primary">
                                    <option value="pdf">PDF</option>
                                    <option value="csv">CSV</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-primary">Select Recipients</label>
                            {recipientsLoading ? (
                                <p className="text-sm text-secondary animate-pulse">Loading recipients...</p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                    {recipients.filter((r: Recipient) => r.isActive).length === 0 && <p className="text-xs text-muted italic">No active saved recipients found.</p>}
                                    {recipients.filter((r: Recipient) => r.isActive).map((recipient: Recipient) => (
                                        <label key={recipient._id} className="flex items-center gap-3 p-3 bg-canvas border border-subtle rounded-lg hover:border-brand-primary/50 cursor-pointer">
                                            <input type="checkbox" className="accent-brand-primary w-4 h-4 rounded" checked={selectedEmails.includes(recipient.email)} onChange={(e) => { if (e.target.checked) setSelectedEmails([...selectedEmails, recipient.email]); else setSelectedEmails(selectedEmails.filter(em => em !== recipient.email)); }} />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-primary">{recipient.name || recipient.email}</p>
                                                {recipient.name && <p className="text-xs text-secondary">{recipient.email}</p>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-secondary uppercase">Or enter custom email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                    <input type="email" placeholder="user@example.com" value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-subtle rounded-lg bg-canvas text-sm focus:border-brand-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-subtle">
                            <button onClick={handleSendReport} disabled={actionLoading} className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50">
                                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                Send Report Email
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Manage Recipients Tab */}
                {activeTab === 'recipients' && (
                    <RecipientManagement recipients={recipients} loading={recipientsLoading} refresh={fetchRecipients} />
                )}

                {/* 4. Automation Settings Tab */}
                {activeTab === 'config' && (
                    <div className="max-w-2xl space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-bold text-primary font-heading mb-2">Daily Automation Config</h2>
                            <p className="text-sm text-secondary">Manage automated daily report generation and dispatch.</p>
                        </div>
                        {configLoading ? (
                            <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 text-brand-primary animate-spin" /></div>
                        ) : config && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-5 bg-elevated border border-subtle rounded-xl text-sm">
                                    <div>
                                        <p className="font-bold text-primary">Enable Automated Daily Reports</p>
                                        <p className="text-secondary text-xs mt-1">Generates and sends a PDF report every day.</p>
                                    </div>
                                    <button onClick={handleToggleConfig} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${config.isDailyReportEnabled ? 'bg-status-success' : 'bg-muted'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.isDailyReportEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className={`p-6 border border-subtle rounded-xl transition-all ${!config.isDailyReportEnabled ? 'opacity-50 pointer-events-none bg-canvas/30' : 'bg-card'}`}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-primary flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-brand-primary" /> Cron Expression</label>
                                            <p className="text-xs text-secondary mb-3">Defines when the report is generated (e.g. <code>0 8 * * *</code> for 8:00 AM).</p>
                                            <input type="text" defaultValue={config.dailyReportSchedule} id="scheduleInput" className="w-full px-4 py-2 border border-subtle rounded-lg bg-canvas font-mono text-sm focus:border-brand-primary" />
                                        </div>
                                        <button onClick={() => { const el = document.getElementById('scheduleInput') as HTMLInputElement; if (el) handleUpdateSchedule(el.value); }} className="px-4 py-2 bg-secondary text-canvas text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">Save Schedule</button>
                                    </div>
                                </div>
                                {config.lastReportSentAt && (
                                    <div className="flex items-center gap-3 p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
                                        <CheckCircle className="h-5 w-5 text-status-success" />
                                        <div>
                                            <p className="text-sm font-semibold text-status-success">Last successful automation run</p>
                                            <p className="text-xs text-status-success/80 mt-0.5">{new Date(config.lastReportSentAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 5. Audit Logs Tab */}
                {activeTab === 'audit' && <AuditLogsPanel />}
            </div>
        </div>
    );
};

// ─── AuditLogsPanel (inline subcomponent) ─────────────────────────────────────
const AuditLogsPanel = () => {
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [exportLoading, setExportLoading] = useState(false);
    const LIMIT = 20;

    const buildParams = useCallback((p = page) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (actionFilter !== 'ALL') params.set('action', actionFilter);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        params.set('page', String(p));
        params.set('limit', String(LIMIT));
        return params.toString();
    }, [search, actionFilter, startDate, endDate, page]);

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (actionFilter !== 'ALL') params.set('action', actionFilter);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            params.set('page', String(p));
            params.set('limit', String(LIMIT));

            const { data }: { data: AuditResponse } = await api.get(`/audit?${params.toString()}`);
            setLogs(data.logs);
            setTotal(data.total);
            setPage(data.page);
            setPages(data.pages);
        } catch {
            toast.error('Failed to fetch audit logs.');
        } finally {
            setLoading(false);
        }
    }, [search, actionFilter, startDate, endDate]);

    useEffect(() => { fetchLogs(1); }, []);

    const handleSearch = () => { setPage(1); fetchLogs(1); };

    const handleExportCSV = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (actionFilter !== 'ALL') params.set('action', actionFilter);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const response = await api.get(`/audit/export/csv?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GTD_Audit-Logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Audit logs exported as CSV!');
        } catch {
            toast.error('Failed to export audit logs.');
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-primary font-heading flex items-center gap-2">
                        <Shield className="h-5 w-5 text-brand-primary" /> System Audit Trail
                    </h2>
                    <p className="text-sm text-secondary mt-1">
                        Real-time record of all system actions.
                        {total > 0 && <span className="ml-2 font-semibold text-brand-primary">{total.toLocaleString()} total entries</span>}
                    </p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={exportLoading || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-elevated border border-subtle text-sm font-semibold rounded-lg hover:bg-canvas transition-colors disabled:opacity-50 text-primary"
                >
                    {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-elevated border border-subtle rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search by user or action…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-4 py-2 border border-subtle rounded-lg bg-canvas text-sm text-primary focus:border-brand-primary focus:outline-none"
                        />
                    </div>
                    {/* Action filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <select
                            value={actionFilter}
                            onChange={e => setActionFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-subtle rounded-lg bg-canvas text-sm text-primary focus:border-brand-primary focus:outline-none appearance-none"
                        >
                            {ALL_ACTIONS.map(a => <option key={a} value={a}>{a === 'ALL' ? 'All Actions' : a.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    {/* Apply button */}
                    <button
                        onClick={handleSearch}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition-colors"
                    >
                        <Search className="w-4 h-4" /> Apply
                    </button>
                </div>
                {/* Date range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-subtle rounded-lg bg-canvas text-sm text-primary focus:border-brand-primary focus:outline-none" placeholder="From date" />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-subtle rounded-lg bg-canvas text-sm text-primary focus:border-brand-primary focus:outline-none" placeholder="To date" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Timestamp</th>
                                <th className="px-4 py-3 font-semibold">User</th>
                                <th className="px-4 py-3 font-semibold">Action</th>
                                <th className="px-4 py-3 font-semibold">Module</th>
                                <th className="px-4 py-3 font-semibold">Details</th>
                                <th className="px-4 py-3 font-semibold text-right">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-subtle bg-card">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-secondary"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-primary" />Loading audit trail…</td></tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <AlertCircle className="h-10 w-10 mx-auto text-muted mb-3" />
                                        <p className="text-primary font-semibold">No logs found</p>
                                        <p className="text-secondary text-xs mt-1">Try adjusting your filters or date range.</p>
                                    </td>
                                </tr>
                            ) : logs.map(log => (
                                <tr key={log._id} className="hover:bg-canvas/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-secondary">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-brand-light flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">
                                                {log.userId?.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-primary text-xs">{log.userId?.username || 'System'}</p>
                                                <p className="text-secondary" style={{ fontSize: '10px' }}>{log.userId?.role || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getActionBadgeClass(log.action)}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-secondary">
                                        {ACTION_MODULE_MAP[log.action] || 'System'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-secondary max-w-xs truncate" title={formatDetails(log.details)}>
                                        {formatDetails(log.details)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs text-secondary font-mono whitespace-nowrap">
                                        {log.ipAddress || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between bg-elevated border border-subtle rounded-xl px-4 py-3">
                    <p className="text-sm text-secondary">
                        Page <span className="font-semibold text-primary">{page}</span> of <span className="font-semibold text-primary">{pages}</span>
                        <span className="ml-2">({total.toLocaleString()} entries)</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { const p = page - 1; setPage(p); fetchLogs(p); }}
                            disabled={page <= 1 || loading}
                            className="p-1.5 border border-subtle rounded-lg text-secondary hover:text-primary hover:bg-canvas disabled:opacity-40 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { const p = page + 1; setPage(p); fetchLogs(p); }}
                            disabled={page >= pages || loading}
                            className="p-1.5 border border-subtle rounded-lg text-secondary hover:text-primary hover:bg-canvas disabled:opacity-40 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── RecipientManagement ────────────────────────────────────────────────────────
interface RecipientManagementProps {
    recipients: Recipient[];
    loading: boolean;
    refresh: () => void;
}

const RecipientManagement = ({ recipients, loading, refresh }: RecipientManagementProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', isActive: true });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post('/reports/recipients', form);
            toast.success('Recipient added');
            setForm({ name: '', email: '', isActive: true });
            setIsAdding(false);
            refresh();
        } catch { toast.error('Failed to add recipient'); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Remove this recipient entirely?')) return;
        try {
            await api.delete(`/reports/recipients/${id}`);
            toast.success('Recipient removed');
            refresh();
        } catch { toast.error('Failed to remove recipient'); }
    };

    const handleToggleState = async (recipient: Recipient) => {
        try {
            await api.put(`/reports/recipients/${recipient._id}`, { ...recipient, isActive: !recipient.isActive });
            toast.success(`Recipient ${recipient.isActive ? 'disabled' : 'enabled'}`);
            refresh();
        } catch { toast.error('Failed to update recipient state'); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-primary font-heading">Recipient Directory</h2>
                    <p className="text-sm text-secondary">Manage who receives automated system reports.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-light text-brand-primary border border-brand-primary/20 text-sm font-semibold rounded-lg hover:bg-brand-primary hover:text-white transition-all"
                >
                    {isAdding ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? 'Cancel' : 'Add Recipient'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="bg-canvas p-5 rounded-xl border border-subtle grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-fade-in shadow-sm">
                    <div className="md:col-span-4 space-y-1">
                        <label className="text-xs font-semibold text-secondary uppercase">Name</label>
                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-subtle rounded-lg text-sm bg-card focus:border-brand-primary" placeholder="John Doe" />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                        <label className="text-xs font-semibold text-secondary uppercase">Email Address</label>
                        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-subtle rounded-lg text-sm bg-card focus:border-brand-primary" placeholder="john@example.com" />
                    </div>
                    <div className="md:col-span-3 flex items-center justify-end">
                        <button disabled={actionLoading} type="submit" className="w-full px-4 py-2 bg-primary text-canvas text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
                            {actionLoading ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto rounded-xl border border-subtle">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Recipient Info</th>
                            <th className="px-6 py-3 font-semibold text-center">Status</th>
                            <th className="px-6 py-3 font-semibold text-center">Added On</th>
                            <th className="px-6 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-secondary">Loading directory...</td></tr>
                        ) : recipients.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-secondary">No recipients configured.</td></tr>
                        ) : recipients.map((r: Recipient) => (
                            <tr key={r._id} className="hover:bg-canvas/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-brand-primary font-bold">
                                            {r.name ? r.name.charAt(0).toUpperCase() : r.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-primary">{r.name || 'Unnamed'}</p>
                                            <p className="text-xs text-secondary">{r.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleToggleState(r)}
                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${r.isActive ? 'bg-status-success/10 text-status-success border-status-success/20 hover:bg-status-success/20' : 'bg-muted/10 text-muted border-subtle hover:bg-muted/20'}`}
                                        title="Click to toggle status"
                                    >
                                        {r.isActive ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center text-secondary text-xs">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(r._id)} className="p-2 text-secondary hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportsModule;
