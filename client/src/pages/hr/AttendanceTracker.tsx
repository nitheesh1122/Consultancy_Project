import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import { CalendarDays, Check, Users, Clock } from 'lucide-react';

const AttendanceTracker = () => {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [workers, setWorkers] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [shift, setShift] = useState('MORNING');
    const [attendance, setAttendance] = useState<Record<string, { status: string; remarks: string }>>({});

    useEffect(() => {
        fetchData();
    }, [date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [wRes, aRes] = await Promise.all([
                api.get('/workers'),
                api.get(`/attendance/date?date=${date}`)
            ]);
            const w = wRes.data?.workers || wRes.data || [];
            const activeWorkers = w.filter((wr: any) => wr.status !== 'INACTIVE');
            setWorkers(activeWorkers);
            setRecords(aRes.data || []);

            // Pre-fill attendance from existing records
            const map: Record<string, { status: string; remarks: string }> = {};
            activeWorkers.forEach((wr: any) => {
                const existing = (aRes.data || []).find((r: any) => r.workerId?._id === wr._id);
                map[wr._id] = {
                    status: existing?.status || 'PRESENT',
                    remarks: existing?.remarks || ''
                };
            });
            setAttendance(map);
        } catch (error) {
            console.error('Error loading attendance data', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = (workerId: string, status: string) => {
        setAttendance(prev => ({ ...prev, [workerId]: { ...prev[workerId], status } }));
    };

    const handleBulkSubmit = async () => {
        setSubmitting(true);
        try {
            const bulkRecords = Object.entries(attendance).map(([workerId, { status, remarks }]) => ({
                workerId,
                date,
                shift,
                status,
                remarks
            }));
            await api.post('/attendance/bulk', { records: bulkRecords });
            toast.success(`Attendance marked for ${bulkRecords.length} workers`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    const presentCount = Object.values(attendance).filter(a => a.status === 'PRESENT').length;
    const absentCount = Object.values(attendance).filter(a => a.status === 'ABSENT').length;
    const leaveCount = Object.values(attendance).filter(a => a.status === 'ON_LEAVE').length;

    const statuses = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'];
    const statusColors: Record<string, string> = {
        'PRESENT': 'bg-green-100 text-green-700 border-green-300',
        'ABSENT': 'bg-red-100 text-red-700 border-red-300',
        'LATE': 'bg-amber-100 text-amber-700 border-amber-300',
        'HALF_DAY': 'bg-yellow-100 text-yellow-700 border-yellow-300',
        'ON_LEAVE': 'bg-blue-100 text-blue-700 border-blue-300',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Attendance Tracker</h1>
                    <p className="text-secondary mt-1 text-sm">Mark daily attendance for all active workers</p>
                </div>
                <Button variant="primary" onClick={handleBulkSubmit} isLoading={submitting} disabled={workers.length === 0}>
                    <Check className="h-4 w-4 mr-2" />Save Attendance
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-secondary uppercase">Date</label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44 h-10" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-secondary uppercase">Shift</label>
                    <select value={shift} onChange={(e) => setShift(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm w-36">
                        <option value="MORNING">Morning</option>
                        <option value="EVENING">Evening</option>
                        <option value="NIGHT">Night</option>
                    </select>
                </div>
                <div className="ml-auto flex gap-3">
                    <div className="bg-card rounded-lg border border-subtle px-4 py-2 text-center">
                        <p className="text-lg font-bold text-green-600">{presentCount}</p>
                        <p className="text-[10px] text-muted uppercase">Present</p>
                    </div>
                    <div className="bg-card rounded-lg border border-subtle px-4 py-2 text-center">
                        <p className="text-lg font-bold text-red-600">{absentCount}</p>
                        <p className="text-[10px] text-muted uppercase">Absent</p>
                    </div>
                    <div className="bg-card rounded-lg border border-subtle px-4 py-2 text-center">
                        <p className="text-lg font-bold text-blue-600">{leaveCount}</p>
                        <p className="text-[10px] text-muted uppercase">Leave</p>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Worker</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-secondary italic">Loading...</td></tr>
                            ) : workers.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-secondary italic">No active workers found</td></tr>
                            ) : workers.map((w: any) => (
                                <tr key={w._id} className="hover:bg-canvas transition-colors">
                                    <td className="px-6 py-3">
                                        <p className="font-semibold text-primary">{w.name}</p>
                                        <p className="text-xs text-muted font-mono">{w.workerId}</p>
                                    </td>
                                    <td className="px-6 py-3 text-secondary text-xs">{w.role?.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-center gap-1.5 flex-wrap">
                                            {statuses.map(s => (
                                                <button key={s} onClick={() => updateStatus(w._id, s)}
                                                    className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${
                                                        attendance[w._id]?.status === s ? statusColors[s] + ' ring-1 ring-offset-1' : 'bg-canvas text-muted border-subtle hover:bg-elevated'
                                                    }`}>
                                                    {s.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <input type="text" value={attendance[w._id]?.remarks || ''}
                                            onChange={(e) => setAttendance(prev => ({ ...prev, [w._id]: { ...prev[w._id], remarks: e.target.value } }))}
                                            className="w-full px-2 py-1 text-xs rounded border border-subtle bg-canvas focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                                            placeholder="Optional note" />
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

export default AttendanceTracker;
