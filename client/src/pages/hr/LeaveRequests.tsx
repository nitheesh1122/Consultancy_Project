import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

const LeaveRequests = () => {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [form, setForm] = useState({ workerId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });

    // Reject modal
    const [showReject, setShowReject] = useState(false);
    const [rejectId, setRejectId] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        try {
            const queryParams = statusFilter ? `?status=${statusFilter}` : '';
            const [lRes, wRes, sRes] = await Promise.all([
                api.get(`/leaves${queryParams}`),
                api.get('/workers'),
                api.get('/leaves/summary')
            ]);
            setLeaves(lRes.data);
            setWorkers((wRes.data?.workers || wRes.data || []).filter((w: any) => w.status !== 'INACTIVE'));
            setSummary(sRes.data);
        } catch (error) {
            console.error('Error loading leaves data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/leaves', form);
            toast.success('Leave request created');
            setShowCreate(false);
            setForm({ workerId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/leaves/${id}/status`, { status: 'APPROVED' });
            toast.success('Leave approved');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async () => {
        try {
            await api.put(`/leaves/${rejectId}/status`, { status: 'REJECTED', rejectionReason: rejectReason });
            toast.success('Leave rejected');
            setShowReject(false);
            setRejectReason('');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Leave Requests</h1>
                    <p className="text-secondary mt-1 text-sm">Manage worker leave requests and approvals</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Leave Request
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><span className="text-xl font-bold">{summary.pending || 0}</span></div>
                    <p className="text-sm text-secondary">Pending</p>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600"><span className="text-xl font-bold">{summary.approved || 0}</span></div>
                    <p className="text-sm text-secondary">Approved</p>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600"><span className="text-xl font-bold">{summary.rejected || 0}</span></div>
                    <p className="text-sm text-secondary">Rejected</p>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><span className="text-xl font-bold">{summary.currentlyOnLeave?.length || 0}</span></div>
                    <p className="text-sm text-secondary">On Leave Today</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${statusFilter === s ? 'bg-brand-primary text-white border-brand-primary' : 'bg-card text-secondary border-subtle hover:bg-elevated'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Worker</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Period</th>
                                <th className="px-6 py-3 text-center">Days</th>
                                <th className="px-6 py-3">Reason</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {leaves.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-secondary italic">No leave requests found</td></tr>
                            ) : leaves.map((l: any) => (
                                <tr key={l._id} className="hover:bg-canvas transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-primary">{l.workerId?.name || '-'}</p>
                                        <p className="text-xs text-muted font-mono">{l.workerId?.workerId}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={l.leaveType === 'SICK' ? 'critical' : l.leaveType === 'EMERGENCY' ? 'warning' : 'info'}>
                                            {l.leaveType}
                                        </StatusBadge>
                                    </td>
                                    <td className="px-6 py-4 text-secondary text-xs">
                                        {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold">{l.days}</td>
                                    <td className="px-6 py-4 text-secondary text-xs max-w-[200px] truncate">{l.reason}</td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={l.status === 'PENDING' ? 'warning' : l.status === 'APPROVED' ? 'success' : 'critical'}>
                                            {l.status}
                                        </StatusBadge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {l.status === 'PENDING' && (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleApprove(l._id)}
                                                    className="text-xs font-semibold px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                                                    <CheckCircle className="h-3 w-3 inline mr-0.5" />Approve
                                                </button>
                                                <button onClick={() => { setRejectId(l._id); setShowReject(true); }}
                                                    className="text-xs font-semibold px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                                                    <XCircle className="h-3 w-3 inline mr-0.5" />Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Leave Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Leave Request">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Worker *</label>
                        <select value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm" required>
                            <option value="">Select worker</option>
                            {workers.map((w: any) => (
                                <option key={w._id} value={w._id}>{w.name} ({w.workerId})</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Leave Type *</label>
                        <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm">
                            <option value="CASUAL">Casual</option>
                            <option value="SICK">Sick</option>
                            <option value="EARNED">Earned</option>
                            <option value="EMERGENCY">Emergency</option>
                            <option value="UNPAID">Unpaid</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Start Date *</label>
                            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">End Date *</label>
                            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Reason *</label>
                        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            required placeholder="Reason for leave..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={submitting}>Submit Request</Button>
                    </div>
                </form>
            </Modal>

            {/* Reject Modal */}
            <Modal isOpen={showReject} onClose={() => setShowReject(false)} title="Reject Leave Request">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Rejection Reason</label>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            placeholder="Optional reason for rejection..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleReject} className="!bg-red-600 hover:!bg-red-700">Reject</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LeaveRequests;
