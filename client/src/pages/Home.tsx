import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangle, TrendingUp, ShoppingCart, FileText, Package, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-lg shadow p-6 flex items-start justify-between border-l-4" style={{ borderColor: color }}>
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-opacity-20`} style={{ backgroundColor: `${color}33` }}>
            <Icon className="h-6 w-6" style={{ color: color }} />
        </div>
    </div>
);

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
            if (user?.role !== 'SUPERVISOR') {
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Hello, {user?.username}</h1>
                    <p className="text-gray-500">Here is what's happening today.</p>
                </div>
                <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold uppercase tracking-wider">
                    {user?.role?.replace('_', ' ')}
                </span>
            </div>

            {/* --- SUPERVISOR VIEW --- */}
            {user?.role === 'SUPERVISOR' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link to="/request-material" className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:opacity-90 transition-opacity">
                            <div className="flex items-center">
                                <FileText className="h-8 w-8 mr-4" />
                                <div>
                                    <h3 className="text-xl font-bold">New Material Request</h3>
                                    <p className="opacity-80 text-sm">Create a new batch request for dyes/chemicals</p>
                                </div>
                            </div>
                        </Link>
                        <StatCard
                            title="My Recent Requests"
                            value={recentMRS.length}
                            icon={Activity}
                            color="#10B981"
                            subtitle="Last 5 shown below"
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700">Recent Requests</div>
                        <div className="divide-y divide-gray-100">
                            {recentMRS.length === 0 ? (
                                <p className="p-6 text-center text-gray-500">No requests made yet.</p>
                            ) : (
                                recentMRS.map((mrs) => (
                                    <div key={mrs._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gray-900">{mrs.batchId}</p>
                                            <p className="text-sm text-gray-500">{new Date(mrs.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${mrs.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            mrs.status === 'ISSUED' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
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

            {/* --- STORE MANAGER / ADMIN VIEW --- */}
            {user?.role !== 'SUPERVISOR' && stats && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Low Stock Items"
                            value={stats.lowStockCount}
                            icon={AlertTriangle}
                            color="#EF4444"
                            subtitle="Action Required"
                        />
                        <StatCard
                            title="Pending MRS"
                            value={stats.pendingMRS}
                            icon={FileText}
                            color="#F59E0B"
                            subtitle="Requests waiting for Issue"
                        />
                        <StatCard
                            title="Pending PIs"
                            value={stats.pendingPIs}
                            icon={ShoppingCart}
                            color="#3B82F6"
                            subtitle="Waiting for Approval"
                        />
                        <StatCard
                            title="Inventory Value"
                            value={`₹${stats.totalInventoryValue.toLocaleString()}`}
                            icon={DollarSign}
                            color="#8B5CF6"
                            subtitle="Estimated Total Value"
                        />
                    </div>

                    {/* Quick Analytics - Imported from Reports logic */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Low Stock Widget */}
                        <div className="bg-white rounded-lg shadow border border-red-200 h-full">
                            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center text-red-800 font-bold">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Critical Low Stock
                            </div>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                {stats.lowStockItems.length > 0 ? (
                                    <table className="w-full text-left">
                                        <thead className="text-xs text-gray-500 bg-gray-50 uppercase sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3">Item Name</th>
                                                <th className="px-6 py-3 text-right">Current Stock</th>
                                                <th className="px-6 py-3 text-right">Min</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {stats.lowStockItems.map((item: any) => (
                                                <tr key={item._id} className="hover:bg-red-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                    <td className="px-6 py-4 text-right text-red-600 font-bold">{item.quantity} {item.unit}</td>
                                                    <td className="px-6 py-4 text-right text-gray-500">{item.minStock} {item.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="p-6 text-center text-green-600">All materials are well stocked!</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Consumption Widget (Simplified) */}
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex items-center justify-center text-gray-500 flex-col">
                            <TrendingUp className="h-12 w-12 mb-2 text-indigo-300" />
                            <h3 className="font-bold text-gray-700">Analytics Overview</h3>
                            <p className="text-sm text-center mb-4">View detailed consumption charts and batch costing analysis.</p>
                            <Link to="/reports" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                Go to Full Reports
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;
