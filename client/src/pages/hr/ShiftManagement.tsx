import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Users, Trash2, CalendarClock } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const ShiftManagement = () => {
    const { socket } = useSocket();
    const [shifts, setShifts] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [selectedShift, setSelectedShift] = useState<any>(null);
    const [assignedWorkers, setAssignedWorkers] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: 'MORNING',
        startTime: '06:00',
        endTime: '14:00',
        capacity: 20,
        remarks: ''
    });

    const shiftTimes: Record<string, { start: string, end: string }> = {
        'MORNING': { start: '06:00', end: '14:00' },
        'EVENING': { start: '14:00', end: '22:00' },
        'NIGHT': { start: '22:00', end: '06:00' },
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    useEffect(() => {
        if (!socket) return;

        const refresh = () => {
            fetchData();
        };

        socket.on('shift:created', refresh);
        socket.on('shift:updated', refresh);

        return () => {
            socket.off('shift:created', refresh);
            socket.off('shift:updated', refresh);
        };
    }, [socket, date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, wRes] = await Promise.all([
                api.get(`/shifts?date=${date}`),
                api.get('/workers')
            ]);
            setShifts(sRes.data);
            setWorkers((wRes.data?.workers || wRes.data || []).filter((w: any) => w.status !== 'INACTIVE'));
        } catch (error) {
            console.error('Error loading shifts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/shifts', { ...form, date });
            toast.success('Shift created');
            setShowCreate(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create shift');
        } finally {
            setSubmitting(false);
        }
    };

    const openAssign = (shift: any) => {
        setSelectedShift(shift);
        setAssignedWorkers(shift.workers?.map((w: any) => w._id) || []);
        setShowAssign(true);
    };

    const toggleWorker = (id: string) => {
        setAssignedWorkers(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
    };

    const handleAssign = async () => {
        if (!selectedShift) return;
        setSubmitting(true);
        try {
            await api.put(`/shifts/${selectedShift._id}/assign`, { workers: assignedWorkers });
            toast.success('Workers assigned');
            setShowAssign(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to assign workers');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this shift?')) return;
        try {
            await api.delete(`/shifts/${id}`);
            toast.success('Shift deleted');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const shiftColors: Record<string, string> = {
        'MORNING': 'bg-amber-50 border-amber-200 text-amber-800',
        'EVENING': 'bg-blue-50 border-blue-200 text-blue-800',
        'NIGHT': 'bg-indigo-50 border-indigo-200 text-indigo-800',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Shift Management</h1>
                    <p className="text-secondary mt-1 text-sm">Create shifts and assign workers to them</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />Create Shift
                </Button>
            </div>

            {/* Date picker */}
            <div className="flex gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-secondary uppercase">Date</label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44 h-10" />
                </div>
                <p className="text-sm text-muted">{shifts.length} shift(s) scheduled</p>
            </div>

            {/* Shift Cards */}
            {loading ? null : shifts.length === 0 ? (
                <div className="bg-card rounded-xl border border-subtle p-12 text-center">
                    <CalendarClock className="h-12 w-12 text-muted mx-auto mb-4" />
                    <p className="text-secondary">No shifts scheduled for {new Date(date).toLocaleDateString()}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {shifts.map((shift: any) => (
                        <div key={shift._id} className={`rounded-xl border-2 p-6 ${shiftColors[shift.name] || 'bg-card border-subtle'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{shift.name} Shift</h3>
                                    <p className="text-sm opacity-70">{shift.startTime} — {shift.endTime}</p>
                                </div>
                                <button onClick={() => handleDelete(shift._id)} className="p-1.5 rounded hover:bg-red-100 text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-semibold mb-2">Workers ({shift.workers?.length || 0}/{shift.capacity})</p>
                                {shift.workers?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {shift.workers.map((w: any) => (
                                            <span key={w._id} className="text-xs px-2 py-0.5 bg-white/50 rounded-md border border-current/10 font-medium">
                                                {w.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs italic opacity-60">No workers assigned</p>
                                )}
                            </div>

                            <button onClick={() => openAssign(shift)}
                                className="w-full text-center text-xs font-semibold py-2 rounded-lg bg-white/60 hover:bg-white/80 border border-current/10 transition-colors">
                                <Users className="h-3 w-3 inline mr-1" />Manage Workers
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Shift Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Shift">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Shift *</label>
                        <select value={form.name} onChange={(e) => {
                            const n = e.target.value;
                            setForm({ ...form, name: n, startTime: shiftTimes[n]?.start || '', endTime: shiftTimes[n]?.end || '' });
                        }} className="w-full h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm">
                            <option value="MORNING">Morning</option>
                            <option value="EVENING">Evening</option>
                            <option value="NIGHT">Night</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Start Time</label>
                            <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">End Time</label>
                            <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Capacity</label>
                        <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Remarks</label>
                        <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={submitting}>Create Shift</Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Workers Modal */}
            <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title={`Assign Workers — ${selectedShift?.name} Shift`} className="!max-w-2xl">
                <div className="space-y-4">
                    <p className="text-sm text-secondary">Select workers to assign ({assignedWorkers.length}/{selectedShift?.capacity} selected)</p>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto border border-subtle rounded-lg p-3">
                        {workers.map((w: any) => (
                            <label key={w._id} className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg transition-colors ${assignedWorkers.includes(w._id) ? 'bg-brand-primary/5 border border-brand-primary/20' : 'hover:bg-elevated'}`}>
                                <input type="checkbox" checked={assignedWorkers.includes(w._id)} onChange={() => toggleWorker(w._id)} className="rounded border-subtle" />
                                <div>
                                    <span className="text-primary font-medium">{w.name}</span>
                                    <span className="text-xs text-muted ml-2">{w.role?.replace(/_/g, ' ')}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAssign} isLoading={submitting}>Save Assignment</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ShiftManagement;
