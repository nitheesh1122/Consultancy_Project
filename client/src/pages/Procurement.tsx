import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Plus, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';

const Procurement = () => {
    const [rfqs, setRFQs] = useState<any[]>([]);
    const [pos, setPOs] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'rfq' | 'po'>('rfq');

    // Create RFQ modal
    const [showCreateRFQ, setShowCreateRFQ] = useState(false);
    const [rfqItems, setRfqItems] = useState([{ materialId: '', quantity: 0, unit: 'KG' }]);
    const [rfqDueDate, setRfqDueDate] = useState('');
    const [rfqSuppliers, setRfqSuppliers] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Quotations modal
    const [showQuotations, setShowQuotations] = useState(false);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [selectedRFQ, setSelectedRFQ] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rfqRes, poRes, matRes, supRes] = await Promise.all([
                api.get('/supplier/rfq'),
                api.get('/supplier/purchase-orders'),
                api.get('/materials'),
                api.get('/suppliers')
            ]);
            setRFQs(rfqRes.data);
            setPOs(poRes.data);
            setMaterials(matRes.data?.materials || matRes.data || []);
            setSuppliers(supRes.data?.suppliers || supRes.data || []);
        } catch (error) {
            console.error('Error loading procurement data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRFQ = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rfqItems.some(i => !i.materialId || i.quantity <= 0)) {
            toast.error('Please fill in all material items');
            return;
        }
        if (rfqSuppliers.length === 0) {
            toast.error('Please select at least one supplier');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/supplier/rfq', {
                items: rfqItems,
                sentToSuppliers: rfqSuppliers,
                dueDate: rfqDueDate || undefined
            });
            toast.success('RFQ created and sent to suppliers');
            setShowCreateRFQ(false);
            setRfqItems([{ materialId: '', quantity: 0, unit: 'KG' }]);
            setRfqSuppliers([]);
            setRfqDueDate('');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create RFQ');
        } finally {
            setSubmitting(false);
        }
    };

    const viewQuotations = async (rfq: any) => {
        setSelectedRFQ(rfq);
        try {
            const { data } = await api.get(`/supplier/rfq/${rfq._id}/quotations`);
            setQuotations(data);
            setShowQuotations(true);
        } catch (err: any) {
            toast.error('Failed to load quotations');
        }
    };

    const handleAcceptQuotation = async (quotationId: string) => {
        try {
            await api.put(`/supplier/quotations/${quotationId}/accept`);
            toast.success('Quotation accepted — PO created');
            setShowQuotations(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to accept quotation');
        }
    };

    const addItem = () => setRfqItems([...rfqItems, { materialId: '', quantity: 0, unit: 'KG' }]);
    const removeItem = (idx: number) => setRfqItems(rfqItems.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: string, value: any) => {
        const updated = [...rfqItems];
        (updated[idx] as any)[field] = value;
        setRfqItems(updated);
    };

    const toggleSupplier = (id: string) => {
        setRfqSuppliers(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Procurement</h1>
                    <p className="text-secondary mt-1 text-sm">Manage RFQs, quotations, and purchase orders</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateRFQ(true)}>
                    <Plus className="h-4 w-4 mr-2" />Create RFQ
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-elevated rounded-lg w-fit border border-subtle">
                <button onClick={() => setTab('rfq')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${tab === 'rfq' ? 'bg-card shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}>
                    <FileText className="h-4 w-4 inline mr-2" />RFQs ({rfqs.length})
                </button>
                <button onClick={() => setTab('po')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${tab === 'po' ? 'bg-card shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}>
                    Purchase Orders ({pos.length})
                </button>
            </div>

            {/* RFQ Table */}
            {tab === 'rfq' && (
                <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">RFQ Number</th>
                                    <th className="px-6 py-3">Items</th>
                                    <th className="px-6 py-3">Suppliers</th>
                                    <th className="px-6 py-3">Due Date</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rfqs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-secondary italic">No RFQs created yet</td></tr>
                                ) : rfqs.map((rfq: any) => (
                                    <tr key={rfq._id} className="hover:bg-canvas transition-colors">
                                        <td className="px-6 py-4 font-semibold text-primary font-mono">{rfq.rfqNumber}</td>
                                        <td className="px-6 py-4">{rfq.items?.length || 0} items</td>
                                        <td className="px-6 py-4">{rfq.sentToSuppliers?.length || 0} suppliers</td>
                                        <td className="px-6 py-4 text-secondary">{rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString() : '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={
                                                rfq.status === 'OPEN' ? 'warning' :
                                                rfq.status === 'PO_CREATED' ? 'success' :
                                                rfq.status === 'CLOSED' ? 'neutral' : 'info'
                                            }>{rfq.status?.replace(/_/g, ' ')}</StatusBadge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => viewQuotations(rfq)}
                                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/20">
                                                <Eye className="h-3 w-3 inline mr-1" />Quotations
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PO Table */}
            {tab === 'po' && (
                <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">PO Number</th>
                                    <th className="px-6 py-3">Supplier</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3">Expected Delivery</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pos.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-secondary italic">No purchase orders yet</td></tr>
                                ) : pos.map((po: any) => (
                                    <tr key={po._id} className="hover:bg-canvas transition-colors">
                                        <td className="px-6 py-4 font-semibold text-primary font-mono">{po.poNumber}</td>
                                        <td className="px-6 py-4">{po.supplierId?.name || '-'}</td>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create RFQ Modal */}
            <Modal isOpen={showCreateRFQ} onClose={() => setShowCreateRFQ(false)} title="Create Request for Quotation" className="!max-w-2xl">
                <form onSubmit={handleCreateRFQ} className="space-y-5">
                    {/* Materials */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-primary">Materials *</label>
                            <button type="button" onClick={addItem} className="text-xs font-semibold text-brand-primary hover:underline">+ Add Item</button>
                        </div>
                        {rfqItems.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <select value={item.materialId} onChange={(e) => updateItem(idx, 'materialId', e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm" required>
                                        <option value="">Select Material</option>
                                        {materials.map((m: any) => (
                                            <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-28">
                                    <Input type="number" value={item.quantity || ''} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                        placeholder="Qty" className="h-10" required />
                                </div>
                                <div className="w-24">
                                    <select value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm">
                                        <option value="KG">KG</option>
                                        <option value="MTR">MTR</option>
                                        <option value="LTR">LTR</option>
                                        <option value="PCS">PCS</option>
                                    </select>
                                </div>
                                {rfqItems.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-status-danger hover:bg-status-danger/10 rounded-lg"><XCircle className="h-4 w-4" /></button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Suppliers */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Send to Suppliers *</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-subtle rounded-lg p-3">
                            {suppliers.map((s: any) => (
                                <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={rfqSuppliers.includes(s._id)} onChange={() => toggleSupplier(s._id)}
                                        className="rounded border-subtle" />
                                    <span className="text-primary">{s.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary">Due Date</label>
                        <Input type="date" value={rfqDueDate} onChange={(e) => setRfqDueDate(e.target.value)} className="h-10" />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateRFQ(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={submitting}><Plus className="h-4 w-4 mr-2" />Create RFQ</Button>
                    </div>
                </form>
            </Modal>

            {/* Quotations Modal */}
            <Modal isOpen={showQuotations} onClose={() => setShowQuotations(false)} title={`Quotations — ${selectedRFQ?.rfqNumber}`} className="!max-w-3xl">
                <div className="space-y-3">
                    {quotations.length === 0 ? (
                        <p className="text-center text-secondary py-8 italic text-sm">No quotations received yet</p>
                    ) : quotations.map((q: any) => (
                        <div key={q._id} className="p-4 rounded-lg border border-subtle bg-canvas hover:bg-elevated transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-primary">{q.supplierId?.name || 'Supplier'}</p>
                                    <p className="text-xs text-muted mt-1">Delivery: {q.deliveryDays} days • Terms: {q.paymentTerms || 'N/A'}</p>
                                    <div className="mt-2 space-y-1">
                                        {q.items?.map((item: any, idx: number) => (
                                            <p key={idx} className="text-xs text-secondary">{item.materialId?.name || 'Material'} — ₹{item.unitPrice}/unit × {item.quantity}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-brand-primary">₹{q.totalPrice?.toLocaleString()}</p>
                                    <StatusBadge status={q.status === 'SUBMITTED' ? 'warning' : q.status === 'ACCEPTED' ? 'success' : 'critical'} className="mt-1">{q.status}</StatusBadge>
                                </div>
                            </div>
                            {q.status === 'SUBMITTED' && (
                                <div className="mt-3 flex justify-end">
                                    <button onClick={() => handleAcceptQuotation(q._id)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                                        <CheckCircle className="h-3 w-3 inline mr-1" />Accept & Create PO
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default Procurement;
