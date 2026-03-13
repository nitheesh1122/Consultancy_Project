import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Clock, CheckCircle, Truck, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';

const statusConfig: Record<string, { color: 'info' | 'success' | 'warning' | 'critical' | 'neutral'; label: string }> = {
    PLACED: { color: 'info', label: 'Placed' },
    APPROVED: { color: 'success', label: 'Approved' },
    FABRIC_RECEIVED: { color: 'info', label: 'Fabric Received' },
    IN_PRODUCTION: { color: 'warning', label: 'In Production' },
    COMPLETED: { color: 'success', label: 'Completed' },
    DISPATCHED: { color: 'info', label: 'Dispatched' },
    DELIVERED: { color: 'success', label: 'Delivered' },
};

const CustomerDashboard = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/customer/orders');
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders', error);
        } finally {
            setLoading(false);
        }
    };

    const activeOrders = orders.filter(o => !['DELIVERED', 'COMPLETED'].includes(o.status));
    const completedOrders = orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));

    if (loading) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">My Orders</h1>
                    <p className="text-secondary mt-1 text-sm">
                        Welcome, <span className="font-semibold text-brand-primary">{user?.username}</span>
                    </p>
                </div>
                <Link to="/customer/create-order">
                    <Button variant="primary"><Plus className="h-4 w-4 mr-2" />Place New Order</Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><ShoppingCart className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{orders.length}</p><p className="text-xs text-muted">Total Orders</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Clock className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{activeOrders.length}</p><p className="text-xs text-muted">Active</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600"><CheckCircle className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{completedOrders.length}</p><p className="text-xs text-muted">Completed</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><Package className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">₹{orders.reduce((sum: number, o: any) => sum + (o.totalValue || 0), 0).toLocaleString()}</p><p className="text-xs text-muted">Total Value</p></div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="px-6 py-4 border-b border-subtle bg-canvas/50">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Order History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Order #</th>
                                <th className="px-6 py-3">Fabric</th>
                                <th className="px-6 py-3">Color</th>
                                <th className="px-6 py-3 text-right">Qty (KG)</th>
                                <th className="px-6 py-3 text-right">Value</th>
                                <th className="px-6 py-3">Delivery</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-secondary italic">No orders yet. Place your first order!</td></tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order._id} className="hover:bg-canvas transition-colors">
                                        <td className="px-6 py-4 font-semibold text-primary font-mono">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-secondary">{order.fabricType}</td>
                                        <td className="px-6 py-4 text-secondary">{order.color}</td>
                                        <td className="px-6 py-4 text-right font-mono">{order.quantity}</td>
                                        <td className="px-6 py-4 text-right font-mono">₹{order.totalValue?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-secondary">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={statusConfig[order.status]?.color || 'neutral'}>{statusConfig[order.status]?.label || order.status}</StatusBadge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link to={`/customer/orders/${order._id}`} className="text-brand-primary text-xs font-semibold hover:underline">Track</Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
