import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Send } from 'lucide-react';

const SubmitQuotation = () => {
    const { rfqId } = useParams();
    const navigate = useNavigate();
    const [rfq, setRfq] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState<{ materialId: string; unitPrice: number; quantity: number }[]>([]);
    const [deliveryDays, setDeliveryDays] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchRFQ();
    }, [rfqId]);

    const fetchRFQ = async () => {
        try {
            // Supplier sees their RFQs - find the specific one
            const { data } = await api.get('/supplier/my-rfq');
            const found = data.find((r: any) => r._id === rfqId);
            if (found) {
                setRfq(found);
                setItems(found.items.map((i: any) => ({
                    materialId: i.materialId?._id || i.materialId,
                    unitPrice: 0,
                    quantity: i.quantity
                })));
            }
        } catch (error) {
            console.error('Error fetching RFQ', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (index: number, price: number) => {
        const updated = [...items];
        updated[index].unitPrice = price;
        setItems(updated);
    };

    const totalPrice = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.some(i => i.unitPrice <= 0)) {
            toast.error('Please enter unit prices for all items');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/supplier/quotation', {
                rfqId,
                items,
                deliveryDays: Number(deliveryDays),
                paymentTerms,
                remarks
            });
            toast.success('Quotation submitted successfully!');
            navigate('/supplier/rfq');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit quotation');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !rfq) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-subtle pb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-elevated transition-colors">
                    <ArrowLeft className="h-5 w-5 text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Submit Quotation</h1>
                    <p className="text-secondary mt-1 text-sm">RFQ: <span className="font-mono text-brand-primary">{rfq.rfqNumber}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                {/* Items pricing */}
                <div className="bg-card rounded-xl border border-subtle shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-subtle bg-canvas/50">
                        <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Material Pricing</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Material</th>
                                    <th className="px-6 py-3 text-right">Quantity</th>
                                    <th className="px-6 py-3 text-right">Unit Price (₹)</th>
                                    <th className="px-6 py-3 text-right">Line Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rfq.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-canvas transition-colors">
                                        <td className="px-6 py-4 font-semibold text-primary">{item.materialId?.name || 'Material'} ({item.materialId?.code})</td>
                                        <td className="px-6 py-4 text-right font-mono">{item.quantity} {item.unit}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Input type="number" value={items[idx]?.unitPrice || ''} onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                                                placeholder="0.00" className="w-32 text-right" required />
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-semibold">₹{((items[idx]?.unitPrice || 0) * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-subtle bg-elevated flex justify-end">
                        <p className="text-sm">Total: <span className="text-xl font-bold text-brand-primary ml-2">₹{totalPrice.toLocaleString()}</span></p>
                    </div>
                </div>

                {/* Delivery & Terms */}
                <div className="bg-card rounded-xl border border-subtle shadow-sm p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary">Delivery Days *</label>
                            <Input type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)}
                                placeholder="e.g. 7" required className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-primary">Payment Terms</label>
                            <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
                                <option value="">Select terms</option>
                                <option value="ADVANCE">100% Advance</option>
                                <option value="NET_30">Net 30 Days</option>
                                <option value="NET_60">Net 60 Days</option>
                                <option value="50_50">50% Advance, 50% on Delivery</option>
                                <option value="COD">Cash on Delivery</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Remarks</label>
                        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-subtle bg-canvas text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            placeholder="Any additional notes..." />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={submitting}>
                        <Send className="h-4 w-4 mr-2" />Submit Quotation
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SubmitQuotation;
