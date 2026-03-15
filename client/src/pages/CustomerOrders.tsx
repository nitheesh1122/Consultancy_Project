import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ShoppingCart, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import OrderPipeline, { ORDER_STAGES } from '../components/OrderPipeline';

const statusConfig: Record<string, { color: 'info' | 'success' | 'warning' | 'critical' | 'neutral'; label: string }> = {
    PLACED: { color: 'info', label: 'Placed' },
    APPROVED: { color: 'success', label: 'Approved' },
    FABRIC_RECEIVED: { color: 'info', label: 'Fabric Received' },
    IN_PRODUCTION: { color: 'warning', label: 'In Production' },
    COMPLETED: { color: 'success', label: 'Completed' },
    DISPATCHED: { color: 'info', label: 'Dispatched' },
    DELIVERED: { color: 'success', label: 'Delivered' },
};

const CustomerOrders = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [dispatchByOrder, setDispatchByOrder] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const { data } = await api.get(`/customer/all-orders${params}`);
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (orderId: string) => {
        setActionLoading(true);
        try {
            await api.put(`/customer/orders/${orderId}/approve`, { remarks });
            toast.success('Order approved');
            setShowModal(false);
            setRemarks('');
            fetchOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, status: string) => {
        setActionLoading(true);
        try {
            await api.put(`/customer/orders/${orderId}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchOrders();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const getNextStatus = (current: string): string | null => {
        const flow: Record<string, string> = {
            APPROVED: 'FABRIC_RECEIVED',
            FABRIC_RECEIVED: 'IN_PRODUCTION',
            IN_PRODUCTION: 'COMPLETED',
            COMPLETED: 'DISPATCHED',
            DISPATCHED: 'DELIVERED',
        };
        return flow[current] || null;
    };

    const fetchDispatchForOrder = async (orderId: string) => {
        if (dispatchByOrder[orderId]) return;
        try {
            const { data } = await api.get(`/dispatch/order/${orderId}`);
            setDispatchByOrder((prev) => ({ ...prev, [orderId]: data }));
        } catch {
            // Dispatch may not exist yet; keep silent for UX.
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Customer Orders</h1>
                    <p className="text-secondary mt-1 text-sm">Manage and approve customer dyeing orders</p>
                </div>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm">
                    <option value="">All Statuses</option>
                    {Object.keys(statusConfig).map(s => (
                        <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                </select>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Order #</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Fabric</th>
                                <th className="px-6 py-3">Color</th>
                                <th className="px-6 py-3 text-right">Qty (KG)</th>
                                <th className="px-6 py-3 text-right">Value</th>
                                <th className="px-6 py-3">Delivery</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center text-secondary italic">No orders found</td></tr>
                            ) : (
                                orders.map((order: any) => (
                                    <React.Fragment key={order._id}>
                                    <tr className="hover:bg-canvas transition-colors cursor-pointer" onClick={() => {
                                        const nextExpanded = expandedOrder === order._id ? null : order._id;
                                        setExpandedOrder(nextExpanded);
                                        if (nextExpanded && ['DISPATCHED', 'DELIVERED'].includes(order.status)) {
                                            fetchDispatchForOrder(order._id);
                                        }
                                    }}>
                                        <td className="px-6 py-4 font-semibold text-primary font-mono">
                                            <div className="flex items-center gap-2">
                                                {expandedOrder === order._id ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                                                {order.orderNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-primary">{order.customerId?.companyName || '-'}</p>
                                                <p className="text-xs text-muted">{order.customerId?.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-secondary">{order.fabricType}</td>
                                        <td className="px-6 py-4 text-secondary">{order.color}</td>
                                        <td className="px-6 py-4 text-right font-mono">{order.quantity}</td>
                                        <td className="px-6 py-4 text-right font-mono">₹{order.totalValue?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-secondary">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={statusConfig[order.status]?.color || 'neutral'}>{statusConfig[order.status]?.label || order.status}</StatusBadge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {order.status === 'PLACED' && (
                                                    <button onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                                                        Approve
                                                    </button>
                                                )}
                                                {getNextStatus(order.status) && (
                                                    <button onClick={() => handleStatusUpdate(order._id, getNextStatus(order.status)!)}
                                                        disabled={actionLoading}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50">
                                                        → {statusConfig[getNextStatus(order.status)!]?.label}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrder === order._id && (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-4 bg-canvas/50">
                                                <div className="max-w-3xl mx-auto">
                                                    <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">Order Pipeline</p>
                                                    <OrderPipeline stages={ORDER_STAGES} currentStatus={order.status} compact />
                                                    {dispatchByOrder[order._id] && (
                                                        <div className="mt-4 p-3 rounded-lg border border-subtle bg-card text-sm">
                                                            <p className="font-semibold text-primary mb-2">Dispatch Details</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-secondary">
                                                                <p><span className="text-muted">Dispatch #:</span> {dispatchByOrder[order._id].dispatchNumber || '-'}</p>
                                                                <p><span className="text-muted">Vehicle:</span> {dispatchByOrder[order._id].vehicleNumber || '-'}</p>
                                                                <p><span className="text-muted">Status:</span> {dispatchByOrder[order._id].status || '-'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval Modal */}
            <Modal isOpen={showModal && !!selectedOrder} onClose={() => { setShowModal(false); setRemarks(''); }} title={`Approve Order ${selectedOrder?.orderNumber}`}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted">Customer:</span> <span className="font-semibold">{selectedOrder?.customerId?.companyName || '-'}</span></div>
                            <div><span className="text-muted">Fabric:</span> <span className="font-semibold">{selectedOrder?.fabricType || '-'}</span></div>
                            <div><span className="text-muted">Quantity:</span> <span className="font-semibold">{selectedOrder?.quantity ?? '-'} KG</span></div>
                            <div><span className="text-muted">Value:</span> <span className="font-bold text-brand-primary">₹{selectedOrder?.totalValue?.toLocaleString?.() || '0'}</span></div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Remarks (optional)</label>
                            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                                placeholder="Any notes..." />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => { setShowModal(false); setRemarks(''); }}>Cancel</Button>
                            <Button variant="primary" isLoading={actionLoading} disabled={!selectedOrder?._id} onClick={() => selectedOrder?._id && handleApprove(selectedOrder._id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />Approve Order
                            </Button>
                        </div>
                    </div>
                </Modal>
        </div>
    );
};

export default CustomerOrders;
