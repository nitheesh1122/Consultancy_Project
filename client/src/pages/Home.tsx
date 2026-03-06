import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangle, TrendingUp, ShoppingCart, FileText, Package, DollarSign, Activity, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/ui/MetricCard';
import DecisionExplanation from '../components/ui/DecisionExplanation';
import { SimpleLineChart } from '../components/Charts';
import HRDashboard from '../components/HRDashboard';

const Home = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentMRS, setRecentMRS] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch General Stats for Admin/Manager
            if (user?.role !== 'SUPERVISOR' && user?.role !== 'HR_MANAGER') {
                const { data } = await api.get('/analytics/dashboard');
                setStats(data);
            }

            // 2. Fetch Supervisor specific data (My Recent Requests)
            if (user?.role === 'SUPERVISOR') {
                const { data } = await api.get('/mrs/my');
                setRecentMRS(data.slice(0, 5)); // Top 5
            }
        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // Let global loader handle initial state or show a skeleton here

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-5">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Dashboard Overview</h1>
                    <p className="text-secondary mt-1 text-sm">
                        Welcome back, <span className="font-semibold text-primary">{user?.username}</span>. Here is the operational status.
                    </p>
                </div>
                <div className="hidden md:block">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-elevated text-secondary border border-subtle">
                        {user?.role?.replace('_', ' ')} View
                    </span>
                </div>
            </div>

            {/* --- SUPERVISOR VIEW --- */}
            {user?.role === 'SUPERVISOR' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link to="/request-material" className="group relative overflow-hidden rounded-xl bg-card p-8 shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-elevated opacity-50 blur-2xl group-hover:bg-indigo-900 transition-colors"></div>
                            <div className="relative z-10 flex items-center">
                                <div className="bg-elevated p-3 rounded-lg mr-4 group-hover:bg-elevated transition-colors shadow-inner">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary font-heading">New Material Request</h3>
                                    <p className="text-muted text-sm mt-1 group-hover:text-muted">Create a new dye/chemical batch request</p>
                                </div>
                            </div>
                        </Link>
                        <MetricCard
                            title="My Recent Requests"
                            value={recentMRS.length}
                            icon={Activity}
                            status="default"
                            trend={{ value: 0, isPositive: true, label: "All time" }}
                        />
                    </div>

                    <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                        <div className="px-6 py-4 border-b border-subtle bg-canvas/50 flex justify-between items-center">
                            <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Recent Request History</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {recentMRS.length === 0 ? (
                                <p className="p-8 text-center text-secondary text-sm italic">No requests generated yet.</p>
                            ) : (
                                recentMRS.map((mrs) => (
                                    <div key={mrs._id} className="p-4 flex justify-between items-center hover:bg-canvas transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-elevated p-2 rounded text-secondary">
                                                <Package className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-primary text-sm">{mrs.batchId}</p>
                                                <p className="text-xs text-secondary">{new Date(mrs.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${mrs.status === 'PENDING' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                                            mrs.status === 'ISSUED' ? 'bg-status-success/10 text-status-success border-status-success/30' :
                                                'bg-canvas text-secondary border-subtle'
                                            }`}>
                                            {mrs.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* --- HR MANAGER VIEW --- */}
            {user?.role === 'HR_MANAGER' && (
                <HRDashboard />
            )}

            {/* --- STORE MANAGER / ADMIN VIEW --- */}
            {user?.role !== 'SUPERVISOR' && user?.role !== 'HR_MANAGER' && stats && (
                <>
                    {/* 1. Critical Decision Block (Conditional) */}
                    {stats.lowStockCount > 0 && (
                        <DecisionExplanation
                            status="critical"
                            title="Operational Risk Detected: Low Inventory"
                            reasons={[
                                `${stats.lowStockCount} items are below safety stock levels.`,
                                "Production delay risk within 48 hours."
                            ]}
                            action="Review Low Stock table below and raise Purchase Indents immediately."
                            impact="Potential stoppage of dyeing line #3 due to chemical shortage."
                        />
                    )}

                    {/* 2. Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Low Stock Items"
                            value={stats.lowStockCount}
                            icon={AlertTriangle}
                            status={stats.lowStockCount > 0 ? "critical" : "good"}
                            trend={{ value: 12, isPositive: stats.lowStockCount === 0, label: "vs last week" }}
                        />
                        <MetricCard
                            title="Pending Requests"
                            value={stats.pendingMRS}
                            icon={FileText}
                            status={stats.pendingMRS > 5 ? "warning" : "default"}
                            trend={{ value: 5, isPositive: false }}
                        />
                        <MetricCard
                            title="Pending Orders (PI)"
                            value={stats.pendingPIs}
                            icon={ShoppingCart}
                            status="default"
                            trend={{ value: 0, isPositive: true }}
                        />
                        <MetricCard
                            title="Inventory Value"
                            value={`₹${(stats.totalInventoryValue / 100000).toFixed(2)}L`}
                            icon={DollarSign}
                            status="default"
                            trend={{ value: 2.5, isPositive: true }}
                        />
                    </div>

                    {/* 3. Detailed Data View */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Low Stock Table - Spans 2 cols */}
                        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-subtle flex flex-col">
                            <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-status-danger/20 rounded text-status-danger">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-bold text-primary text-sm">Critical Low Stock</h3>
                                </div>
                                <Link to="/inventory" className="text-xs font-medium text-primary hover:text-primary hover:underline">
                                    View Full Inventory
                                </Link>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                {stats.lowStockItems.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Item Name</th>
                                                <th className="px-6 py-3 text-right font-semibold">Ready Stock</th>
                                                <th className="px-6 py-3 text-right font-semibold">Min Level</th>
                                                <th className="px-6 py-3 text-center font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {stats.lowStockItems.slice(0, 5).map((item: any) => (
                                                <tr key={item._id} className="hover:bg-status-danger/10/10 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-primary">{item.name}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-status-danger">{item.quantity} {item.unit}</td>
                                                    <td className="px-6 py-3 text-right text-secondary">{item.minStock} {item.unit}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-danger/20 text-status-danger">
                                                            Critical
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-status-success/20 text-status-success mb-3">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <p className="text-primary font-medium">Healthy Inventory Levels</p>
                                        <p className="text-secondary text-sm mt-1">No critical items detected below minimum thresholds.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions & Links */}
                        <div className="space-y-6">
                            <div className="bg-card p-6 rounded-xl shadow-sm border border-subtle">
                                <h3 className="font-bold text-lg font-heading mb-4 text-primary">Monthly Cost Trend</h3>
                                {stats.costTrend && stats.costTrend.length > 0 ? (
                                    <div className="h-48">
                                        <SimpleLineChart
                                            data={stats.costTrend}
                                            xKey="month"
                                            lines={[{ key: 'cost', name: 'Cost', color: '#6366f1' }]}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm text-secondary text-center py-8">Not enough data for cost analysis.</p>
                                )}
                            </div>

                            <div className="bg-card text-primary p-6 rounded-xl shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold text-lg font-heading mb-2">Deep Analytics</h3>
                                    <p className="text-muted text-sm mb-4">Analyze batch costs, supplier performance, and consumption trends.</p>
                                    <Link to="/reports" className="inline-flex items-center justify-center px-4 py-2 bg-card text-primary text-sm font-bold rounded-lg hover:bg-elevated transition-colors w-full">
                                        Open Reports
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
