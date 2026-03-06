import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, UserCheck, CalendarClock, CalendarOff, AlertTriangle } from 'lucide-react';
import MetricCard from './ui/MetricCard';

const HRDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHRStats();
    }, []);

    const fetchHRStats = async () => {
        try {
            const { data } = await api.get('/analytics/hr-dashboard');
            setStats(data);
        } catch (error) {
            console.error('Error fetching HR dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Workforce"
                    value={stats?.totalWorkers || 0}
                    icon={Users}
                    status="default"
                    trend={{ value: 0, isPositive: true, label: "Active" }}
                />
                <MetricCard
                    title="Present Today"
                    value={stats?.activeWorkers || 0}
                    icon={UserCheck}
                    status="good"
                    trend={{ value: 100, isPositive: true, label: "Attendance" }}
                />
                <MetricCard
                    title="Active Shifts"
                    value={stats?.activeShifts || 0}
                    icon={CalendarClock}
                    status="default"
                    trend={{ value: 2, isPositive: true, label: "Current" }}
                />
                <MetricCard
                    title="Pending Leaves"
                    value={stats?.pendingLeaves || 0}
                    icon={CalendarOff}
                    status={stats?.pendingLeaves > 0 ? "warning" : "default"}
                    trend={{ value: stats?.workersOnLeave || 0, isPositive: false, label: "On Leave" }}
                />
            </div>

            {/* Detailed Data View (Placeholders for now) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl shadow-sm border border-subtle flex flex-col">
                    <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-light/50 rounded text-brand-primary">
                                <CalendarOff className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-primary text-sm">Recent Leave Requests</h3>
                        </div>
                    </div>
                    <div className="p-8 text-center">
                        <p className="text-secondary text-sm italic">Connect Leave module to view pending approvals.</p>
                    </div>
                </div>

                <div className="bg-card rounded-xl shadow-sm border border-subtle flex flex-col">
                    <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-status-warning/20 rounded text-status-warning">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-primary text-sm">Attendance Anomalies</h3>
                        </div>
                    </div>
                    <div className="p-8 text-center">
                        <p className="text-secondary text-sm italic">No recent late punch-ins or unauthorized absences detected.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
