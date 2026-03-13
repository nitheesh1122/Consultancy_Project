import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Plus, Truck, Package, ArrowRight } from 'lucide-react';

const DispatchPage = () => {
    const [dispatches, setDispatches] = useState<any[]>([]);
    const [completedOrders, setCompletedOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        customerOrderId: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        dispatchDate: '',
        expectedDelivery: '',
        deliveryAddress: '',
        invoiceNumber: '',
        remarks: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dispRes, ordRes] = await Promise.all([
                api.get('/dispatch'),
                api.get('/customer/all-orders')
            ]);
            setDispatches(dispRes.data);
            setCompletedOrders((ordRes.data || []).filter((o: any) => o.status === 'COMPLETED'));
        } catch (error) {
            console.error('Error loading dispatch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.customerOrderId || !form.vehicleNumber || !form.dispatchDate) {
            toast.error('Please fill in required fields');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/dispatch', form);
            toast.success('Dispatch created successfully');
            setShowCreate(false);
            setForm({ customerOrderId: '', vehicleNumber: '', driverName: '', driverPhone: '', dispatchDate: '', expectedDelivery: '', deliveryAddress: '', invoiceNumber: '', remarks: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create dispatch');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await api.put(`/dispatch/${id}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Dispatch Management</h1>
                    <p className="text-secondary mt-1 text-sm">Create and track dispatches for completed customer orders</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreate(true)} disabled={completedOrders.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />Create Dispatch
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Package className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{dispatches.length}</p><p className="text-xs text-muted">Total Dispatches</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Truck className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{dispatches.filter((d: any) => d.status === 'DISPATCHED' || d.status === 'IN_TRANSIT').length}</p><p className="text-xs text-muted">In Transit</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600"><Package className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{dispatches.filter((d: any) => d.status === 'DELIVERED').length}</p><p className="text-xs text-muted">Delivered</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600"><Package className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{completedOrders.length}</p><p className="text-xs text-muted">Awaiting Dispatch</p></div>
                </div>
            </div>

            {/* Dispatch Table */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Dispatch #</th>
                                <th className="px-6 py-3">Order</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Vehicle</th>
                                <th className="px-6 py-3">Dispatch Date</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {dispatches.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-secondary italic">No dispatches yet</td></tr>
                            ) : dispatches.map((d: any) => (
                                <tr key={d._id} className="hover:bg-canvas transition-colors">
                                    <td className="px-6 py-4 font-semibold text-primary font-mono">{d.dispatchNumber}</td>
                                    <td className="px-6 py-4 font-mono text-sm">{d.customerOrderId?.orderNumber || '-'}</td>
                                    <td className="px-6 py-4">{d.customerId?.companyName || d.customerId?.name || '-'}</td>
                                    <td className="px-6 py-4 font-mono">{d.vehicleNumber}</td>
                                    <td className="px-6 py-4 text-secondary">{d.dispatchDate ? new Date(d.dispatchDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={
                                            d.status === 'PACKED' ? 'neutral' :
                                            d.status === 'DISPATCHED' ? 'warning' :
                                            d.status === 'IN_TRANSIT' ? 'info' :
                                            d.status === 'DELIVERED' ? 'success' : 'critical'
                                        }>{d.status?.replace(/_/g, ' ')}</StatusBadge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {d.status === 'DISPATCHED' && (
                                                <button onClick={() => handleStatusUpdate(d._id, 'IN_TRANSIT')}
                                                    className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                                                    <ArrowRight className="h-3 w-3 inline mr-0.5" />In Transit
                                                </button>
                                            )}
                                            {d.status === 'IN_TRANSIT' && (
                                                <button onClick={() => handleStatusUpdate(d._id, 'DELIVERED')}
                                                    className="text-xs font-semibold px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                                                    <ArrowRight className="h-3 w-3 inline mr-0.5" />Delivered
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Dispatch Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Dispatch" className="!max-w-2xl">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Customer Order *</label>
                        <select value={form.customerOrderId} onChange={(e) => setForm({ ...form, customerOrderId: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm" required>
                            <option value="">Select completed order</option>
                            {completedOrders.map((o: any) => (
                                <option key={o._id} value={o._id}>{o.orderNumber} — {o.fabricType} ({o.quantity} KG)</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Vehicle Number *</label>
                            <Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="TN-38-AB-1234" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Dispatch Date *</label>
                            <Input type="date" value={form.dispatchDate} onChange={(e) => setForm({ ...form, dispatchDate: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Driver Name</label>
                            <Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} placeholder="Driver name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Driver Phone</label>
                            <Input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} placeholder="Phone" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Expected Delivery</label>
                            <Input type="date" value={form.expectedDelivery} onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-primary">Invoice Number</label>
                            <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="INV-XXX" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Delivery Address</label>
                        <textarea value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Remarks</label>
                        <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={submitting}><Truck className="h-4 w-4 mr-2" />Create Dispatch</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DispatchPage;
