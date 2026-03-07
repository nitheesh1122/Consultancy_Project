import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import api from '../lib/api';
import {
    FileText, Download, Mail, Users, Settings,
    Calendar, CheckCircle, XCircle, Plus, Edit2, Trash2,
    RefreshCw, Clock, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type TabType = 'generate' | 'recipients' | 'send' | 'config';

const ReportsModule = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('generate');

    // Config State
    const [config, setConfig] = useState<any>(null);
    const [configLoading, setConfigLoading] = useState(false);

    // Recipients State
    const [recipients, setRecipients] = useState<any[]>([]);
    const [recipientsLoading, setRecipientsLoading] = useState(false);

    // Generate/Send State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [newEmailInput, setNewEmailInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Initial Fetch
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
        } catch (error) {
            toast.error('Failed to load automation config.');
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchRecipients = async () => {
        setRecipientsLoading(true);
        try {
            const { data } = await api.get('/reports/recipients');
            setRecipients(data);
        } catch (error) {
            toast.error('Failed to load recipients.');
        } finally {
            setRecipientsLoading(false);
        }
    };

    // --- Actions ---

    const handleDownload = async () => {
        setActionLoading(true);
        try {
            const response = await api.get(`/reports/generate?startDate=${startDate}&endDate=${endDate}&format=${format}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SystemReport_${startDate}_to_${endDate}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Report downloaded successfully!');
        } catch (error) {
            toast.error('Failed to download report.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendReport = async () => {
        let emailsToSend = [...selectedEmails];
        if (newEmailInput.trim() && /^\S+@\S+\.\S+$/.test(newEmailInput)) {
            emailsToSend.push(newEmailInput.trim());
        }

        if (emailsToSend.length === 0) {
            toast.error('Please select or enter at least one email address.');
            return;
        }

        setActionLoading(true);
        try {
            await api.post('/reports/send', {
                startDate,
                endDate,
                format,
                emails: emailsToSend
            });
            toast.success('Report dispatched successfully to selected emails!');
            setNewEmailInput('');
            setSelectedEmails([]);
        } catch (error) {
            toast.error('Failed to send report.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleConfig = async () => {
        if (!config) return;
        setConfigLoading(true);
        try {
            const { data } = await api.put('/reports/config', {
                isDailyReportEnabled: !config.isDailyReportEnabled,
                dailyReportSchedule: config.dailyReportSchedule
            });
            setConfig(data);
            toast.success(`Daily automated reports ${data.isDailyReportEnabled ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            toast.error('Failed to update config.');
        } finally {
            setConfigLoading(false);
        }
    };

    const handleUpdateSchedule = async (newSchedule: string) => {
        if (!config) return;
        setConfigLoading(true);
        try {
            const { data } = await api.put('/reports/config', {
                isDailyReportEnabled: config.isDailyReportEnabled,
                dailyReportSchedule: newSchedule
            });
            setConfig(data);
            toast.success('Schedule updated successfully.');
        } catch (error) {
            toast.error('Failed to update schedule.');
        } finally {
            setConfigLoading(false);
        }
    };

    // Access Control
    if (user?.role !== 'ADMIN') {
        return <Navigate to="/unauthorized" />;
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary">System Reporting</h1>
                    <p className="text-secondary mt-1 text-sm">Automated reporting and email notification management.</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto space-x-1 bg-elevated p-1 rounded-xl border border-subtle scrollbar-hide">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'generate' ? 'bg-brand-primary text-white shadow-md' : 'text-secondary hover:text-primary hover:bg-canvas'
                        }`}
                >
                    <Download className="w-4 h-4" /> Download Report
                </button>
                <button
                    onClick={() => setActiveTab('send')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'send' ? 'bg-brand-primary text-white shadow-md' : 'text-secondary hover:text-primary hover:bg-canvas'
                        }`}
                >
                    <Mail className="w-4 h-4" /> Send Email
                </button>
                <button
                    onClick={() => setActiveTab('recipients')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'recipients' ? 'bg-brand-primary text-white shadow-md' : 'text-secondary hover:text-primary hover:bg-canvas'
                        }`}
                >
                    <Users className="w-4 h-4" /> Manage Recipients
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'config' ? 'bg-brand-primary text-white shadow-md' : 'text-secondary hover:text-primary hover:bg-canvas'
                        }`}
                >
                    <Settings className="w-4 h-4" /> Automation Settings
                </button>
            </div>

            {/* Tab Content Areas */}
            <div className="bg-card border border-subtle rounded-xl shadow-sm p-6 lg:p-8">

                {/* 1. Generate / Download Tab */}
                {activeTab === 'generate' && (
                    <div className="max-w-3xl space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-bold text-primary font-heading mb-2">Generate System Report</h2>
                            <p className="text-sm text-secondary">Select a date range to generate a comprehensive system audit and activity report.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-subtle rounded-lg text-sm text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-subtle rounded-lg text-sm text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-primary">Report Format</label>
                            <div className="flex gap-4">
                                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${format === 'pdf' ? 'border-brand-primary bg-brand-light' : 'border-subtle hover:bg-elevated'}`}>
                                    <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} className="accent-brand-primary h-4 w-4" />
                                    <div>
                                        <p className="font-semibold text-primary text-sm">PDF Document</p>
                                        <p className="text-xs text-secondary mt-0.5">Presentation ready</p>
                                    </div>
                                </label>
                                <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${format === 'csv' ? 'border-brand-primary bg-brand-light' : 'border-subtle hover:bg-elevated'}`}>
                                    <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} className="accent-brand-primary h-4 w-4" />
                                    <div>
                                        <p className="font-semibold text-primary text-sm">CSV Spreadsheet</p>
                                        <p className="text-xs text-secondary mt-0.5">Raw data format</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-subtle">
                            <button
                                onClick={handleDownload}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-canvas font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Download {format.toUpperCase()}
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Send via Email Tab */}
                {activeTab === 'send' && (
                    <div className="max-w-3xl space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-bold text-primary font-heading mb-2">Dispatch Report via Email</h2>
                            <p className="text-sm text-secondary">Generate and send reports directly to configured recipients or a new email.</p>
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
                                    {recipients.filter(r => r.isActive).length === 0 && <p className="text-xs text-muted italic">No active saved recipients found.</p>}
                                    {recipients.filter(r => r.isActive).map(recipient => (
                                        <label key={recipient._id} className="flex items-center gap-3 p-3 bg-canvas border border-subtle rounded-lg hover:border-brand-primary/50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="accent-brand-primary w-4 h-4 rounded"
                                                checked={selectedEmails.includes(recipient.email)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedEmails([...selectedEmails, recipient.email]);
                                                    else setSelectedEmails(selectedEmails.filter(e => e !== recipient.email));
                                                }}
                                            />
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
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={newEmailInput}
                                        onChange={(e) => setNewEmailInput(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-subtle rounded-lg bg-canvas text-sm focus:border-brand-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-subtle">
                            <button
                                onClick={handleSendReport}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                Send Report Email
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Manage Recipients Tab */}
                {activeTab === 'recipients' && (
                    <RecipientManagement
                        recipients={recipients}
                        loading={recipientsLoading}
                        refresh={fetchRecipients}
                    />
                )}

                {/* 4. Automation Settings Tab */}
                {activeTab === 'config' && (
                    <div className="max-w-2xl space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-bold text-primary font-heading mb-2">Daily Automation Config</h2>
                            <p className="text-sm text-secondary">Manage automated daily report generation and dispatch to active recipients.</p>
                        </div>

                        {configLoading ? (
                            <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 text-brand-primary animate-spin" /></div>
                        ) : config && (
                            <div className="space-y-6">
                                {/* Toggle Switch */}
                                <div className="flex items-center justify-between p-5 bg-elevated border border-subtle text-sm">
                                    <div>
                                        <p className="font-bold text-primary">Enable Automated Daily Reports</p>
                                        <p className="text-secondary text-xs mt-1">Generates and sends a PDF report every day.</p>
                                    </div>
                                    <button
                                        onClick={handleToggleConfig}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${config.isDailyReportEnabled ? 'bg-status-success' : 'bg-muted'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.isDailyReportEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Schedule Form */}
                                <div className={`p-6 border border-subtle rounded-xl transition-all ${!config.isDailyReportEnabled ? 'opacity-50 pointer-events-none bg-canvas/30' : 'bg-card'}`}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-primary flex items-center gap-2 mb-1">
                                                <Clock className="w-4 h-4 text-brand-primary" /> Cron Expression
                                            </label>
                                            <p className="text-xs text-secondary mb-3">Defines exactly when the report is generated (e.g. <code>0 8 * * *</code> for 8:00 AM).</p>
                                            <input
                                                type="text"
                                                defaultValue={config.dailyReportSchedule}
                                                id="scheduleInput"
                                                className="w-full px-4 py-2 border border-subtle rounded-lg bg-canvas font-mono text-sm focus:border-brand-primary"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById('scheduleInput') as HTMLInputElement;
                                                if (el) handleUpdateSchedule(el.value);
                                            }}
                                            className="px-4 py-2 bg-secondary text-canvas text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            Save Schedule
                                        </button>
                                    </div>
                                </div>

                                {/* Metadata */}
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
            </div>
        </div>
    );
};

// Subcomponent for handling recipients easily
const RecipientManagement = ({ recipients, loading, refresh }: any) => {
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
        } catch (error) {
            toast.error('Failed to add recipient');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Remove this recipient entirely?')) return;
        try {
            await api.delete(`/reports/recipients/${id}`);
            toast.success('Recipient removed');
            refresh();
        } catch (error) {
            toast.error('Failed to remove recipient');
        }
    };

    const handleToggleState = async (recipient: any) => {
        try {
            await api.put(`/reports/recipients/${recipient._id}`, {
                ...recipient, isActive: !recipient.isActive
            });
            toast.success(`Recipient ${recipient.isActive ? 'disabled' : 'enabled'}`);
            refresh();
        } catch (error) {
            toast.error('Failed to update recipient state');
        }
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
                        ) : recipients.map(r => (
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
