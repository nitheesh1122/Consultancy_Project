import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import { Plus, FileText, CheckCircle, XCircle, Eye, ClipboardList, Send, RotateCcw, Loader2, AlertCircle } from 'lucide-react';

const Procurement = () => {
    const [searchParams] = useSearchParams();
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
    const [piSourceLabel, setPiSourceLabel] = useState('');

    // Approved PIs picker
    const [approvedPIs, setApprovedPIs] = useState<any[]>([]);
    const [showPIPicker, setShowPIPicker] = useState(false);

        // Quotation selection & approval flow
        const [selectedQuotationIds, setSelectedQuotationIds] = useState<string[]>([]);
        const [submittingApproval, setSubmittingApproval] = useState(false);
        const [poGeneratingId, setPoGeneratingId] = useState('');

    // Quotations modal
    const [showQuotations, setShowQuotations] = useState(false);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [selectedRFQ, setSelectedRFQ] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-load PI if navigated from InwardEntry
    useEffect(() => {
        const piId = searchParams.get('fromPiId');
        if (piId && materials.length > 0 && !loading) {
            loadFromPiId(piId);
        }
    }, [searchParams, materials, loading]);

    const loadFromPiId = async (piId: string) => {
        try {
            const { data } = await api.get('/pi');
            const pi = data.find((p: any) => p._id === piId);
            if (pi && pi.items?.length) {
                prefillRFQFromPI(pi);
            }
        } catch { /* silently ignore */ }
    };

    const prefillRFQFromPI = (pi: any) => {
        const items = (pi.items || []).map((item: any) => ({
            materialId: item.materialId?._id || item.materialId,
            quantity: item.quantity,
            unit: item.materialId?.unit || 'KG'
        })).filter((i: any) => i.materialId && i.quantity > 0);
        if (items.length === 0) return;
        setRfqItems(items);
        setPiSourceLabel(`Pre-filled from PI #${pi._id?.slice(-6)}`);
        setShowCreateRFQ(true);
    };

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
            setSelectedQuotationIds([]);
        try {
            const { data } = await api.get(`/supplier/rfq/${rfq._id}/quotations`);
            setQuotations(data);
            setShowQuotations(true);
        } catch (err: any) {
            toast.error('Failed to load quotations');
        }
    };

    const handleSubmitForApproval = async () => {
        if (!selectedRFQ || selectedQuotationIds.length === 0) {
            toast.error('Select at least one quotation to submit');
            return;
        }
        setSubmittingApproval(true);
        try {
            await api.put(`/supplier/rfq/${selectedRFQ._id}/submit-for-approval`, { quotationIds: selectedQuotationIds });
            toast.success(selectedRFQ.isReRequest
                ? `Re-request submitted — awaiting manager approval`
                : `${selectedQuotationIds.length} quotation(s) submitted for manager approval`);
            setShowQuotations(false);
            setSelectedQuotationIds([]);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit for approval');
        } finally { setSubmittingApproval(false); }
    };

    const handleGeneratePO = async (rfq: any) => {
        setPoGeneratingId(rfq._id);
        try {
            const { data } = await api.post(`/supplier/rfq/${rfq._id}/generate-po`);
            toast.success(`PO ${data.purchaseOrder.poNumber} generated and sent to supplier!`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate PO');
        } finally { setPoGeneratingId(''); }
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

    const fetchApprovedPIs = async () => {
        try {
            const { data } = await api.get('/pi');
            const approved = (data as any[]).filter((p: any) => p.status === 'APPROVED' && p.items?.length > 0);
            setApprovedPIs(approved);
            setShowPIPicker(true);
        } catch {
            toast.error('Failed to load approved PIs');
        }
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
                                                   rfq.status === 'QUOTATIONS_RECEIVED' ? 'info' :
                                                   rfq.status === 'PENDING_MANAGER_APPROVAL' ? 'warning' :
                                                   rfq.status === 'MANAGER_APPROVED' ? 'success' :
                                                   rfq.status === 'PO_ISSUED' ? 'success' :
                                                   rfq.status === 'SUPPLIER_REJECTED' ? 'critical' :
                                                   rfq.status === 'CLOSED' ? 'neutral' :
                                                   rfq.status === 'PO_CREATED' ? 'success' : 'info'
                                            }>{rfq.status?.replace(/_/g, ' ')}</StatusBadge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {['OPEN', 'QUOTATIONS_RECEIVED', 'SUPPLIER_REJECTED'].includes(rfq.status) && (
                                                <button onClick={() => viewQuotations(rfq)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${rfq.status === 'SUPPLIER_REJECTED' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-brand-primary/20'}`}>
                                                    {rfq.status === 'SUPPLIER_REJECTED' ? <><RotateCcw className="h-3 w-3" />Re-request</> : <><Eye className="h-3 w-3" />Quotations</>}
                                                </button>
                                            )}
                                            {rfq.status === 'PENDING_MANAGER_APPROVAL' && (
                                                <span className="text-xs font-medium text-amber-600 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Awaiting Manager</span>
                                            )}
                                            {rfq.status === 'MANAGER_APPROVED' && (
                                                <button onClick={() => handleGeneratePO(rfq)} disabled={!!poGeneratingId} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-50">
                                                    {poGeneratingId === rfq._id ? <><Loader2 className="h-3 w-3 animate-spin" />Generating...</> : <><Send className="h-3 w-3" />Generate PO</>}
                                                </button>
                                            )}
                                            {['PO_ISSUED', 'PO_CREATED', 'CLOSED'].includes(rfq.status) && (
                                                <span className="text-xs font-medium text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />PO Issued</span>
                                            )}
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
                    {piSourceLabel && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
                            <ClipboardList className="h-4 w-4 shrink-0" />
                            {piSourceLabel}
                            <button type="button" onClick={() => { setPiSourceLabel(''); setRfqItems([{ materialId: '', quantity: 0, unit: 'KG' }]); }} className="ml-auto text-green-500 hover:text-green-700 text-xs underline">Clear</button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-subtle" />
                        <button type="button" onClick={fetchApprovedPIs} className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline px-2 py-1 rounded hover:bg-brand-primary/5 transition-colors">
                            <ClipboardList className="h-3.5 w-3.5" />Load from Approved PI
                        </button>
                        <div className="flex-1 h-px bg-subtle" />
                    </div>
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
            {/* Quotations Modal */}
            <Modal isOpen={showQuotations} onClose={() => { setShowQuotations(false); setSelectedQuotationIds([]); }} title={`Quotations — ${selectedRFQ?.rfqNumber}`} className="!max-w-3xl">
                <div className="space-y-3">
                    {selectedRFQ?.status === 'SUPPLIER_REJECTED' && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p className="text-xs"><span className="font-semibold">{selectedRFQ?.approvedSupplierId?.name || 'The selected supplier'}</span> rejected the PO. Select alternative quotation(s) and re-submit for manager approval.</p>
                        </div>
                    )}
                    {quotations.length === 0 ? (
                        <p className="text-center text-secondary py-8 italic text-sm">No quotations received yet</p>
                    ) : (() => {
                        const canSelect = ['QUOTATIONS_RECEIVED', 'SUPPLIER_REJECTED'].includes(selectedRFQ?.status);
                        return quotations.map((q: any) => {
                            const isPrevRejected = selectedRFQ?.status === 'SUPPLIER_REJECTED' && q._id === selectedRFQ?.approvedQuotationId;
                            const isSelected = selectedQuotationIds.includes(q._id);
                            return (
                                <div key={q._id}
                                    onClick={() => {
                                        if (!canSelect || isPrevRejected) return;
                                        setSelectedQuotationIds(prev =>
                                            prev.includes(q._id) ? prev.filter(id => id !== q._id) : [...prev, q._id]
                                        );
                                    }}
                                    className={`p-4 rounded-lg border transition-colors ${isPrevRejected ? 'opacity-50 cursor-not-allowed bg-canvas border-subtle' : canSelect ? 'cursor-pointer ' + (isSelected ? 'border-brand-primary bg-brand-primary/5' : 'border-subtle bg-canvas hover:bg-elevated') : 'bg-canvas border-subtle'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            {canSelect && !isPrevRejected && (
                                                <input type="checkbox" checked={isSelected} readOnly className="mt-1 accent-brand-primary h-4 w-4 flex-shrink-0" />
                                            )}
                                            <div>
                                                <p className="font-semibold text-primary">{q.supplierId?.name || 'Supplier'}</p>
                                                {isPrevRejected && (
                                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5"><XCircle className="h-3 w-3" />Supplier rejected previous PO</p>
                                                )}
                                                <p className="text-xs text-muted mt-1">Delivery: {q.deliveryDays} days • Terms: {q.paymentTerms || 'N/A'}</p>
                                                <div className="mt-2 space-y-1">
                                                    {q.items?.map((item: any, idx: number) => (
                                                        <p key={idx} className="text-xs text-secondary">{item.materialId?.name || 'Material'} — ₹{item.unitPrice}/unit × {item.quantity}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-bold text-brand-primary">₹{q.totalPrice?.toLocaleString()}</p>
                                            <StatusBadge status={q.status === 'SUBMITTED' ? 'warning' : q.status === 'ACCEPTED' ? 'success' : 'critical'} className="mt-1">{q.status}</StatusBadge>
                                        </div>
                                    </div>
                                </div>
                            );
                        });
                    })()}
                    {['QUOTATIONS_RECEIVED', 'SUPPLIER_REJECTED'].includes(selectedRFQ?.status) && (
                        <div className="border-t border-subtle pt-3 flex items-center justify-between">
                            <p className="text-sm text-secondary">{selectedQuotationIds.length} quotation(s) selected</p>
                            <button
                                onClick={handleSubmitForApproval}
                                disabled={selectedQuotationIds.length === 0 || submittingApproval}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingApproval ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {selectedRFQ?.status === 'SUPPLIER_REJECTED' ? `Re-submit (${selectedQuotationIds.length}) for Approval` : `Submit (${selectedQuotationIds.length}) for Manager Approval`}
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* PI Picker Modal */}
            <Modal isOpen={showPIPicker} onClose={() => setShowPIPicker(false)} title="Load from Approved PI" className="!max-w-lg">
                <div className="space-y-3">
                    {approvedPIs.length === 0 ? (
                        <p className="text-center text-secondary py-6 text-sm italic">No approved Purchase Indents found</p>
                    ) : approvedPIs.map((pi: any) => (
                        <div key={pi._id} className="p-3 rounded-lg border border-subtle hover:border-brand-primary/40 transition-colors bg-canvas">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-primary font-mono text-sm">PI #{pi._id.slice(-6).toUpperCase()}</p>
                                    <p className="text-xs text-secondary mt-0.5">{pi.items?.length} item(s) · {new Date(pi.createdAt).toLocaleDateString()}</p>
                                    <div className="mt-1.5 space-y-0.5">
                                        {pi.items?.slice(0, 3).map((item: any, idx: number) => (
                                            <p key={idx} className="text-xs text-muted">• {item.materialId?.name || 'Material'} — {item.quantity} {item.materialId?.unit || 'KG'}</p>
                                        ))}
                                        {pi.items?.length > 3 && <p className="text-xs text-muted">+{pi.items.length - 3} more</p>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { prefillRFQFromPI(pi); setShowPIPicker(false); }}
                                    className="ml-4 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors shrink-0"
                                >
                                    Use this PI
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default Procurement;
