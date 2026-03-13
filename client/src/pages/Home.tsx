import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import {
    AlertTriangle, TrendingUp, ShoppingCart, FileText, Package, DollarSign,
    Activity, Truck, Users, Factory, Shield, Clock, CheckCircle2, Eye,
    ArrowRight, Layers, Settings
} from 'lucide-react';
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
            if (user?.role === 'MANAGER') {
                const { data } = await api.get('/analytics/dashboard/manager');
                setStats(data);
            } else if (user?.role === 'STORE_MANAGER') {
                const { data } = await api.get('/analytics/dashboard/store-manager');
                setStats(data);
            } else if (user?.role === 'ADMIN') {
                const { data } = await api.get('/analytics/dashboard/admin');
                setStats(data);
            } else if (user?.role === 'SUPERVISOR') {
                const { data } = await api.get('/mrs/my');
                setRecentMRS(data.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    const roleLabels: Record<string, string> = {
        MANAGER: 'Manager',
        STORE_MANAGER: 'Store Manager',
        ADMIN: 'Administrator',
        SUPERVISOR: 'Supervisor',
        HR_MANAGER: 'HR Manager',
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">
                        {roleLabels[user?.role || ''] || ''} Dashboard
                    </h1>
                    <p className="text-secondary mt-1 text-sm">
                        Welcome back, <span className="font-semibold text-brand-primary">{user?.username}</span>.
                    </p>
                </div>
                <div className="hidden md:block">
                    <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide bg-brand-light text-brand-primary border border-brand-primary/20">
                        {user?.role?.replace('_', ' ')} View
                    </span>
                </div>
            </div>

            {/* ========== SUPERVISOR VIEW ========== */}
            {user?.role === 'SUPERVISOR' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link to="/request-material" className="group relative overflow-hidden rounded-xl bg-card p-8 shadow-sm border border-subtle transition-all hover:shadow-md hover:border-brand-primary/20">
                            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-brand-primary/5 blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
                            <div className="relative z-10 flex items-center">
                                <div className="bg-brand-light p-3 rounded-xl mr-4 border border-brand-primary/10">
                                    <FileText className="h-8 w-8 text-brand-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary font-heading">New Material Request</h3>
                                    <p className="text-muted text-sm mt-1">Create a new dye/chemical batch request</p>
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

            {/* ========== HR MANAGER VIEW ========== */}
            {user?.role === 'HR_MANAGER' && <HRDashboard />}

            {/* ========== MANAGER VIEW ========== */}
            {user?.role === 'MANAGER' && stats && (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Active Orders"
                            value={stats.activeOrders}
                            icon={ShoppingCart}
                            status={stats.activeOrders > 0 ? "default" : "good"}
                            trend={{ value: stats.totalOrders, isPositive: true, label: "total orders" }}
                        />
                        <MetricCard
                            title="Total Revenue"
                            value={`₹${(stats.totalRevenue / 100000).toFixed(2)}L`}
                            icon={DollarSign}
                            status="good"
                            trend={{ value: stats.completedOrders, isPositive: true, label: "completed" }}
                        />
                        <MetricCard
                            title="PI Awaiting Approval"
                            value={stats.pendingPIApprovals}
                            icon={Clock}
                            status={stats.pendingPIApprovals > 3 ? "warning" : "default"}
                            trend={{ value: 0, isPositive: true }}
                        />
                        <MetricCard
                            title="Active Suppliers"
                            value={stats.activeSuppliers}
                            icon={Truck}
                            status="default"
                            trend={{ value: 0, isPositive: true }}
                        />
                    </div>

                    {/* Production & Machine Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-subtle">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg"><Factory className="h-5 w-5 text-blue-600" /></div>
                                <h3 className="font-bold text-primary text-sm">Machines</h3>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-primary">{stats.activeMachines}</p>
                                    <p className="text-xs text-secondary mt-1">active of {stats.totalMachines} total</p>
                                </div>
                                <Link to="/production/machines" className="text-xs text-brand-primary hover:underline font-medium flex items-center gap-1">
                                    Manage <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-subtle">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-100 rounded-lg"><Activity className="h-5 w-5 text-amber-600" /></div>
                                <h3 className="font-bold text-primary text-sm">Production In Progress</h3>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-primary">{stats.batchesInProgress}</p>
                                    <p className="text-xs text-secondary mt-1">batches running</p>
                                </div>
                                <Link to="/production/monitor" className="text-xs text-brand-primary hover:underline font-medium flex items-center gap-1">
                                    Monitor <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-subtle">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
                                <h3 className="font-bold text-primary text-sm">Batches Completed</h3>
                            </div>
                            <p className="text-3xl font-bold text-primary">{stats.batchesCompleted}</p>
                            <p className="text-xs text-secondary mt-1">all time</p>
                        </div>
                    </div>

                    {/* Recent Orders + Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-subtle">
                            <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                                <h3 className="font-bold text-primary text-sm">Recent Customer Orders</h3>
                                <Link to="/customer-orders" className="text-xs font-medium text-brand-primary hover:underline">View All</Link>
                            </div>
                            <div className="overflow-x-auto">
                                {stats.recentOrders.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-semibold">Order #</th>
                                                <th className="px-6 py-3 text-left font-semibold">Customer</th>
                                                <th className="px-6 py-3 text-right font-semibold">Value</th>
                                                <th className="px-6 py-3 text-center font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {stats.recentOrders.map((order: any) => (
                                                <tr key={order._id} className="hover:bg-canvas transition-colors">
                                                    <td className="px-6 py-3 font-mono font-medium text-primary">{order.orderNumber}</td>
                                                    <td className="px-6 py-3 text-primary">{order.customerId?.companyName || '—'}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-primary">₹{order.totalValue?.toLocaleString()}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                            order.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                                                            order.status === 'IN_PRODUCTION' ? 'bg-amber-100 text-amber-700' :
                                                            order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                            'bg-elevated text-secondary'
                                                        }`}>{order.status.replace('_', ' ')}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="p-8 text-center text-secondary text-sm italic">No customer orders yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Link to="/pi-approvals" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <ShoppingCart className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">PI Approvals</h4>
                                        <p className="text-xs text-secondary">{stats.pendingPIApprovals} pending approvals</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                            <Link to="/suppliers" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <Truck className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">Suppliers</h4>
                                        <p className="text-xs text-secondary">{stats.activeSuppliers} active suppliers</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                            <Link to="/analytics" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">Analytics & Reports</h4>
                                        <p className="text-xs text-secondary">Deep business insights</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                            <Link to="/hr" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <Users className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">Human Resources</h4>
                                        <p className="text-xs text-secondary">Manage workforce</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* ========== STORE MANAGER VIEW ========== */}
            {user?.role === 'STORE_MANAGER' && stats && (
                <>
                    {/* Critical Alert */}
                    {stats.lowStockCount > 0 && (
                        <DecisionExplanation
                            status="critical"
                            title="Low Inventory Alert"
                            reasons={[
                                `${stats.lowStockCount} items are below safety stock levels.`,
                                "Production may be impacted — raise Purchase Indents now."
                            ]}
                            action="Review low stock items below and raise PIs immediately."
                            impact="Potential production line stoppage within 48 hours."
                        />
                    )}

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Low Stock Items"
                            value={stats.lowStockCount}
                            icon={AlertTriangle}
                            status={stats.lowStockCount > 0 ? "critical" : "good"}
                            trend={{ value: 0, isPositive: stats.lowStockCount === 0, label: "items below min" }}
                        />
                        <MetricCard
                            title="Pending MRS"
                            value={stats.pendingMRS}
                            icon={FileText}
                            status={stats.pendingMRS > 5 ? "warning" : "default"}
                            trend={{ value: 0, isPositive: false, label: "to process" }}
                        />
                        <MetricCard
                            title="PIs Raised (Awaiting)"
                            value={stats.pendingPIs}
                            icon={ShoppingCart}
                            status="default"
                            trend={{ value: stats.approvedPIs, isPositive: true, label: "approved" }}
                        />
                        <MetricCard
                            title="Inventory Value"
                            value={`₹${(stats.totalInventoryValue / 100000).toFixed(2)}L`}
                            icon={DollarSign}
                            status="default"
                            trend={{ value: stats.totalMaterials, isPositive: true, label: "materials" }}
                        />
                    </div>

                    {/* Low Stock Table + Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-subtle flex flex-col">
                            <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-status-danger/20 rounded text-status-danger">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-bold text-primary text-sm">Critical Low Stock</h3>
                                </div>
                                <Link to="/inventory" className="text-xs font-medium text-brand-primary hover:underline">View Full Inventory</Link>
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
                                                <tr key={item._id} className="hover:bg-status-danger/10 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-primary">{item.name}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-status-danger">{item.quantity} {item.unit}</td>
                                                    <td className="px-6 py-3 text-right text-secondary">{item.minStock} {item.unit}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-danger/20 text-status-danger">Critical</span>
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
                                        <p className="text-secondary text-sm mt-1">All items above minimum thresholds.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Link to="/mrs-list" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <FileText className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">Material Requests</h4>
                                        <p className="text-xs text-secondary">{stats.pendingMRS} pending to issue</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                            <Link to="/raise-pi" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <ShoppingCart className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">Raise Purchase Indent</h4>
                                        <p className="text-xs text-secondary">Create new PI for low stock</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                            <Link to="/inward-entry" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <Truck className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">Inward Entry</h4>
                                        <p className="text-xs text-secondary">{stats.approvedPIs} PIs ready for inward</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                            <Link to="/dispatch" className="block bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-light rounded-lg border border-brand-primary/10">
                                        <Truck className="h-5 w-5 text-brand-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm">Dispatch</h4>
                                        <p className="text-xs text-secondary">{stats.pendingDispatches} packed & ready</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent MRS */}
                    {stats.recentMRS && stats.recentMRS.length > 0 && (
                        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                            <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                                <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Recent Material Requests</h3>
                                <Link to="/mrs-list" className="text-xs text-brand-primary hover:underline font-medium">View All</Link>
                            </div>
                            <div className="divide-y divide-border">
                                {stats.recentMRS.map((mrs: any) => (
                                    <div key={mrs._id} className="p-4 flex justify-between items-center hover:bg-canvas transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-elevated p-2 rounded text-secondary"><Package className="h-4 w-4" /></div>
                                            <div>
                                                <p className="font-semibold text-primary text-sm">{mrs.batchId}</p>
                                                <p className="text-xs text-secondary">{new Date(mrs.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            mrs.status === 'PENDING' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                                            mrs.status === 'ISSUED' ? 'bg-status-success/10 text-status-success border-status-success/30' :
                                            'bg-canvas text-secondary border-subtle'
                                        }`}>{mrs.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ========== ADMIN VIEW ========== */}
            {user?.role === 'ADMIN' && stats && (
                <>
                    {/* System Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <MetricCard title="Total Users" value={stats.totalUsers} icon={Users} status="default" trend={{ value: 0, isPositive: true }} />
                        <MetricCard title="Materials" value={stats.totalMaterials} icon={Package} status="default" trend={{ value: stats.lowStockCount, isPositive: stats.lowStockCount === 0, label: "low stock" }} />
                        <MetricCard title="Suppliers" value={stats.totalSuppliers} icon={Truck} status="default" trend={{ value: 0, isPositive: true }} />
                        <MetricCard title="Machines" value={stats.totalMachines} icon={Factory} status="default" trend={{ value: 0, isPositive: true }} />
                        <MetricCard title="Customer Orders" value={stats.totalOrders} icon={ShoppingCart} status="default" trend={{ value: stats.activeBatches, isPositive: true, label: "active batches" }} />
                    </div>

                    {/* Users by Role + Quick Links */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-card rounded-xl shadow-sm border border-subtle">
                            <div className="px-6 py-4 border-b border-subtle">
                                <h3 className="font-bold text-primary text-sm">Users by Role</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {stats.usersByRole.map((r: any) => (
                                    <div key={r._id} className="flex items-center justify-between p-3 bg-canvas rounded-lg">
                                        <span className="text-sm font-medium text-primary">{r._id?.replace('_', ' ')}</span>
                                        <span className="text-sm font-bold text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-full">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-subtle">
                            <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                                <h3 className="font-bold text-primary text-sm">Recent Audit Log</h3>
                                <Link to="/reports" className="text-xs text-brand-primary hover:underline font-medium">View Full Audit</Link>
                            </div>
                            <div className="overflow-x-auto">
                                {stats.recentAuditLogs.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Action</th>
                                                <th className="px-4 py-3 text-left font-semibold">User</th>
                                                <th className="px-4 py-3 text-left font-semibold">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {stats.recentAuditLogs.map((log: any) => (
                                                <tr key={log._id} className="hover:bg-canvas transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-xs font-mono bg-elevated px-2 py-0.5 rounded text-primary">{log.action}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-primary text-xs">{log.userId?.username || '—'} <span className="text-muted">({log.userId?.role?.replace('_', ' ') || '—'})</span></td>
                                                    <td className="px-4 py-2.5 text-secondary text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="p-8 text-center text-secondary text-sm italic">No audit logs recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Admin Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Link to="/settings" className="bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-light rounded-lg"><Settings className="h-5 w-5 text-brand-primary" /></div>
                                <div>
                                    <h4 className="font-bold text-primary text-sm">System Settings</h4>
                                    <p className="text-xs text-secondary">Configure system</p>
                                </div>
                            </div>
                        </Link>
                        <Link to="/analytics" className="bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-light rounded-lg"><TrendingUp className="h-5 w-5 text-brand-primary" /></div>
                                <div>
                                    <h4 className="font-bold text-primary text-sm">Analytics</h4>
                                    <p className="text-xs text-secondary">Reports & insights</p>
                                </div>
                            </div>
                        </Link>
                        <Link to="/reports" className="bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-light rounded-lg"><Shield className="h-5 w-5 text-brand-primary" /></div>
                                <div>
                                    <h4 className="font-bold text-primary text-sm">Reports & Audit</h4>
                                    <p className="text-xs text-secondary">Full audit trail</p>
                                </div>
                            </div>
                        </Link>
                        <Link to="/manage-customers" className="bg-card p-5 rounded-xl shadow-sm border border-subtle hover:border-brand-primary/20 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-light rounded-lg"><Users className="h-5 w-5 text-brand-primary" /></div>
                                <div>
                                    <h4 className="font-bold text-primary text-sm">Manage Customers</h4>
                                    <p className="text-xs text-secondary">Customer accounts</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
