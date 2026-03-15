import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { Users, Factory } from 'lucide-react';

const WorkerAssignment = () => {
    const [workers, setWorkers] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [wRes, bRes] = await Promise.all([
                api.get('/workers'),
                api.get('/production-batches')
            ]);
            setWorkers((wRes.data?.workers || wRes.data || []).filter((w: any) => w.status !== 'INACTIVE'));
            setBatches((bRes.data || []).filter((b: any) => ['SCHEDULED', 'IN_PROGRESS'].includes(b.status)));
        } catch (error) {
            console.error('Error loading data', error);
        } finally {
            setLoading(false);
        }
    };

    const availableWorkers = workers.filter(w => w.status === 'ACTIVE');
    const busyWorkers = workers.filter(w => w.status === 'BUSY');
    const onLeaveWorkers = workers.filter(w => w.status === 'ON_LEAVE');

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="border-b border-subtle pb-6">
                <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Worker Assignment Board</h1>
                <p className="text-secondary mt-1 text-sm">View current worker assignments across batches and machines</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600"><Users className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{availableWorkers.length}</p><p className="text-xs text-muted">Available</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Factory className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{busyWorkers.length}</p><p className="text-xs text-muted">Busy/Assigned</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Users className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{onLeaveWorkers.length}</p><p className="text-xs text-muted">On Leave</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><Factory className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{batches.length}</p><p className="text-xs text-muted">Active Batches</p></div>
                </div>
            </div>

            {/* Active Batches with Workers */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-primary">Active Production Batches</h2>
                {batches.length === 0 ? (
                    <p className="text-secondary text-sm italic">No active batches</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {batches.map((batch: any) => (
                            <div key={batch._id} className="bg-card rounded-xl border border-subtle p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-primary">{batch.batchNumber || batch._id.slice(-6)}</p>
                                        <p className="text-xs text-muted">{batch.lotNumber || 'Lot N/A'} • {batch.machineId?.name || 'Machine N/A'}</p>
                                    </div>
                                    <StatusBadge status={batch.status === 'IN_PROGRESS' ? 'warning' : 'info'}>{batch.status}</StatusBadge>
                                </div>
                                <div className="border-t border-subtle pt-3">
                                    <p className="text-xs font-semibold text-secondary mb-2">Assigned Workers ({(batch.assignedWorkers || batch.workers || []).length || 0})</p>
                                    {(batch.assignedWorkers || batch.workers || []).length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {(batch.assignedWorkers || batch.workers || []).map((w: any) => (
                                                <span key={w._id || w} className="text-xs px-2 py-0.5 bg-elevated rounded-md border border-subtle font-medium text-primary">
                                                    {w.name || w}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted italic">No workers assigned</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Available Workers */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="px-6 py-4 border-b border-subtle bg-canvas/50">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Available Workers</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Worker</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Machine Types</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {availableWorkers.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-secondary italic">All workers are assigned or on leave</td></tr>
                            ) : availableWorkers.map((w: any) => (
                                <tr key={w._id} className="hover:bg-canvas transition-colors">
                                    <td className="px-6 py-3">
                                        <p className="font-semibold text-primary">{w.name}</p>
                                        <p className="text-xs text-muted font-mono">{w.workerId}</p>
                                    </td>
                                    <td className="px-6 py-3 text-secondary text-xs">{w.role?.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(w.skills?.machineTypes || []).map((m: string) => (
                                                <span key={m} className="text-[10px] px-1.5 py-0.5 bg-elevated text-muted rounded border border-subtle">{m}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <StatusBadge status="success">AVAILABLE</StatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkerAssignment;
