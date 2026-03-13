import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { CheckCircle, Truck } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

const SupplierPurchaseOrders = () => {
    const [pos, setPOs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShipModal, setShowShipModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [shipForm, setShipForm] = useState({
        dispatchDate: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        expectedDelivery: ''
    });

    useEffect(() => {
        fetchPOs();
    }, []);

    const fetchPOs = async () => {
        try {
            const { data } = await api.get('/supplier/my-purchase-orders');
            setPOs(data);
        } catch (error) {
            console.error('Error fetching POs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (poId: string) => {
        setActionLoading(true);
        try {
            await api.put(`/supplier/purchase-orders/${poId}/confirm`);
            toast.success('PO confirmed');
            fetchPOs();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to confirm');
        } finally {
            setActionLoading(false);
        }
    };

    const handleShipment = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post('/supplier/shipment', {
                purchaseOrderId: selectedPO._id,
                ...shipForm
            });
            toast.success('Shipment created');
            setShowShipModal(false);
            setShipForm({ dispatchDate: '', vehicleNumber: '', driverName: '', driverPhone: '', expectedDelivery: '' });
            fetchPOs();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create shipment');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="border-b border-subtle pb-6">
                <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Purchase Orders</h1>
                <p className="text-secondary mt-1 text-sm">Confirm orders and update shipment status</p>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">PO Number</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3">Expected Delivery</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {pos.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-secondary italic">No purchase orders</td></tr>
                            ) : pos.map((po: any) => (
                                <tr key={po._id} className="hover:bg-canvas transition-colors">
                                    <td className="px-6 py-4 font-semibold text-primary font-mono">{po.poNumber}</td>
                                    <td className="px-6 py-4">
                                        {po.items?.map((item: any, idx: number) => (
                                            <p key={idx} className="text-xs text-secondary">{item.materialId?.name || 'Material'} × {item.quantity}</p>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-semibold">₹{po.totalAmount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-secondary">{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={
                                            po.status === 'ISSUED' ? 'warning' :
                                            po.status === 'CONFIRMED' ? 'info' :
                                            po.status === 'SHIPPED' ? 'info' :
                                            po.status === 'DELIVERED' ? 'success' : 'neutral'
                                        }>{po.status}</StatusBadge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {po.status === 'ISSUED' && (
                                                <button disabled={actionLoading} onClick={() => handleConfirm(po._id)}
                                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-50">
                                                    <CheckCircle className="h-3 w-3 inline mr-1" />Confirm
                                                </button>
                                            )}
                                            {po.status === 'CONFIRMED' && (
                                                <button onClick={() => { setSelectedPO(po); setShowShipModal(true); }}
                                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                                                    <Truck className="h-3 w-3 inline mr-1" />Ship
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

            {/* Shipment Modal */}
            <Modal isOpen={showShipModal && !!selectedPO} onClose={() => setShowShipModal(false)} title={`Create Shipment — ${selectedPO?.poNumber}`}>
                    <form onSubmit={handleShipment} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Dispatch Date *</label>
                                <Input type="date" value={shipForm.dispatchDate} onChange={(e) => setShipForm({ ...shipForm, dispatchDate: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Vehicle Number *</label>
                                <Input type="text" value={shipForm.vehicleNumber} onChange={(e) => setShipForm({ ...shipForm, vehicleNumber: e.target.value })} placeholder="e.g. TN-38-AB-1234" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Driver Name</label>
                                <Input type="text" value={shipForm.driverName} onChange={(e) => setShipForm({ ...shipForm, driverName: e.target.value })} placeholder="Driver name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-primary">Driver Phone</label>
                                <Input type="text" value={shipForm.driverPhone} onChange={(e) => setShipForm({ ...shipForm, driverPhone: e.target.value })} placeholder="Phone number" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-primary">Expected Delivery *</label>
                                <Input type="date" value={shipForm.expectedDelivery} onChange={(e) => setShipForm({ ...shipForm, expectedDelivery: e.target.value })} required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowShipModal(false)}>Cancel</Button>
                            <Button type="submit" variant="primary" isLoading={actionLoading}><Truck className="h-4 w-4 mr-2" />Create Shipment</Button>
                        </div>
                    </form>
            </Modal>
        </div>
    );
};

export default SupplierPurchaseOrders;
