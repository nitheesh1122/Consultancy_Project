import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { FileText, ShoppingCart, Truck, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';

const SupplierDashboard = () => {
    const { user } = useAuth();
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [pos, setPOs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rfqRes, poRes] = await Promise.all([
                api.get('/supplier/my-rfq'),
                api.get('/supplier/my-purchase-orders')
            ]);
            setRfqs(rfqRes.data);
            setPOs(poRes.data);
        } catch (error) {
            console.error('Error loading supplier data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Supplier Dashboard</h1>
                    <p className="text-secondary mt-1 text-sm">Welcome, <span className="font-semibold text-emerald-600">{user?.username}</span></p>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><FileText className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{rfqs.length}</p><p className="text-xs text-muted">Open RFQs</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><ShoppingCart className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{pos.length}</p><p className="text-xs text-muted">Purchase Orders</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Package className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{pos.filter(p => p.status === 'CONFIRMED').length}</p><p className="text-xs text-muted">Awaiting Shipment</p></div>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><Truck className="h-6 w-6" /></div>
                    <div><p className="text-2xl font-bold text-primary">{pos.filter(p => p.status === 'SHIPPED').length}</p><p className="text-xs text-muted">In Transit</p></div>
                </div>
            </div>

            {/* Open RFQs */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="px-6 py-4 border-b border-subtle bg-canvas/50 flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Open RFQs</h3>
                    <Link to="/supplier/rfq" className="text-xs font-semibold text-emerald-600 hover:underline">View All</Link>
                </div>
                <div className="divide-y divide-border">
                    {rfqs.length === 0 ? (
                        <p className="p-8 text-center text-secondary text-sm italic">No open RFQs at the moment.</p>
                    ) : rfqs.slice(0, 5).map((rfq: any) => (
                        <div key={rfq._id} className="p-4 flex justify-between items-center hover:bg-canvas transition-colors">
                            <div>
                                <p className="font-semibold text-primary text-sm font-mono">{rfq.rfqNumber}</p>
                                <p className="text-xs text-muted">{rfq.items.length} items • Due: {rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <Link to={`/supplier/rfq/${rfq._id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                                Submit Quote
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Purchase Orders */}
            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="px-6 py-4 border-b border-subtle bg-canvas/50 flex justify-between items-center">
                    <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Purchase Orders</h3>
                    <Link to="/supplier/purchase-orders" className="text-xs font-semibold text-emerald-600 hover:underline">View All</Link>
                </div>
                <div className="divide-y divide-border">
                    {pos.length === 0 ? (
                        <p className="p-8 text-center text-secondary text-sm italic">No purchase orders yet.</p>
                    ) : pos.slice(0, 5).map((po: any) => (
                        <div key={po._id} className="p-4 flex justify-between items-center hover:bg-canvas transition-colors">
                            <div>
                                <p className="font-semibold text-primary text-sm font-mono">{po.poNumber}</p>
                                <p className="text-xs text-muted">₹{po.totalAmount?.toLocaleString()} • {po.items?.length} items</p>
                            </div>
                            <StatusBadge status={
                                po.status === 'ISSUED' ? 'warning' :
                                po.status === 'CONFIRMED' ? 'info' :
                                po.status === 'SHIPPED' ? 'info' :
                                po.status === 'DELIVERED' ? 'success' : 'neutral'
                            }>{po.status}</StatusBadge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SupplierDashboard;
