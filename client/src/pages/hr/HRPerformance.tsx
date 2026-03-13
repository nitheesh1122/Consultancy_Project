import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { TrendingUp, Users, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const HRPerformance = () => {
    const [workers, setWorkers] = useState<any[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [wRes, aRes] = await Promise.all([
                api.get('/workers'),
                api.get('/attendance/summary')
            ]);
            setWorkers((wRes.data?.workers || wRes.data || []).filter((w: any) => w.status !== 'INACTIVE'));
            setAttendanceSummary(aRes.data || {});
        } catch (error) {
            console.error('Error loading performance data', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate performance metrics from workers
    const avgYield = workers.length > 0
        ? (workers.reduce((sum, w) => sum + (w.performance?.yieldPercentage || 0), 0) / workers.length).toFixed(1)
        : '0';
    const avgAttendance = workers.length > 0
        ? (workers.reduce((sum, w) => sum + (w.performance?.attendanceScore || 0), 0) / workers.length).toFixed(1)
        : '0';
    const totalIncidents = workers.reduce((sum, w) => sum + (w.performance?.safetyIncidents || 0), 0);
    
    // Top performers by yield
    const topPerformers = [...workers]
        .sort((a, b) => (b.performance?.yieldPercentage || 0) - (a.performance?.yieldPercentage || 0))
        .slice(0, 10);

    // Yield chart data
    const yieldChartData = topPerformers.map(w => ({
        name: w.name?.split(' ')[0] || w.workerId,
        yield: w.performance?.yieldPercentage || 0,
        attendance: w.performance?.attendanceScore || 0
    }));

    // Role distribution
    const roleCounts: Record<string, number> = {};
    workers.forEach(w => {
        roleCounts[w.role] = (roleCounts[w.role] || 0) + 1;
    });
    const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    // Status distribution
    const statusCounts: Record<string, number> = {};
    workers.forEach(w => {
        statusCounts[w.status] = (statusCounts[w.status] || 0) + 1;
    });

    // Workers with low attendance
    const lowAttendance = workers.filter(w => (w.performance?.attendanceScore || 0) < 80);

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="border-b border-subtle pb-6">
                <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Worker Performance Dashboard</h1>
                <p className="text-secondary mt-1 text-sm">Performance metrics, yield tracking, and workforce analytics</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600"><TrendingUp className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{avgYield}%</p><p className="text-xs text-muted">Avg Yield</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Users className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{avgAttendance}%</p><p className="text-xs text-muted">Avg Attendance</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><Award className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{workers.length}</p><p className="text-xs text-muted">Total Workers</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{totalIncidents}</p><p className="text-xs text-muted">Safety Incidents</p></div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yield Chart */}
                <div className="bg-card rounded-xl border border-subtle p-6">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide mb-4">Top Workers by Yield %</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yieldChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="yield" fill="#10b981" radius={[4, 4, 0, 0]} name="Yield %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Role Distribution */}
                <div className="bg-card rounded-xl border border-subtle p-6">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide mb-4">Workforce by Role</h3>
                    <div className="h-64 flex items-center justify-center">
                        {roleData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {roleData.map((_, idx) => (
                                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="text-muted text-sm italic">No data</p>}
                    </div>
                </div>
            </div>

            {/* Workers with Low Attendance */}
            {lowAttendance.length > 0 && (
                <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                    <div className="px-6 py-4 border-b border-subtle bg-red-50/50">
                        <h3 className="font-bold text-red-700 text-sm uppercase tracking-wide">Low Attendance Workers (&lt;80%)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Worker</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3 text-right">Attendance %</th>
                                    <th className="px-6 py-3 text-right">Yield %</th>
                                    <th className="px-6 py-3 text-right">Safety Incidents</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {lowAttendance.map((w: any) => (
                                    <tr key={w._id} className="hover:bg-canvas transition-colors">
                                        <td className="px-6 py-3 font-semibold text-primary">{w.name} <span className="text-xs text-muted font-mono">({w.workerId})</span></td>
                                        <td className="px-6 py-3 text-secondary text-xs">{w.role?.replace(/_/g, ' ')}</td>
                                        <td className="px-6 py-3 text-right font-mono text-red-600 font-bold">{w.performance?.attendanceScore || 0}%</td>
                                        <td className="px-6 py-3 text-right font-mono">{w.performance?.yieldPercentage || 0}%</td>
                                        <td className="px-6 py-3 text-right font-mono">{w.performance?.safetyIncidents || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Full Worker Performance Table */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="px-6 py-4 border-b border-subtle bg-canvas/50">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide">All Worker Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Worker</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-right">Yield %</th>
                                <th className="px-6 py-3 text-right">Attendance</th>
                                <th className="px-6 py-3 text-right">Incidents</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {topPerformers.map((w: any) => (
                                <tr key={w._id} className="hover:bg-canvas transition-colors">
                                    <td className="px-6 py-3 font-semibold text-primary">{w.name}</td>
                                    <td className="px-6 py-3 text-secondary text-xs">{w.role?.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                                            w.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                            w.status === 'BUSY' ? 'bg-amber-100 text-amber-700' :
                                            w.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>{w.status}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono font-semibold">{w.performance?.yieldPercentage || 0}%</td>
                                    <td className="px-6 py-3 text-right font-mono">{w.performance?.attendanceScore || 0}%</td>
                                    <td className="px-6 py-3 text-right font-mono">{w.performance?.safetyIncidents || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HRPerformance;
