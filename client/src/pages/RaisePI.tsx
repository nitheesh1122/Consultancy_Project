import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, Trash2, Save, ShoppingCart, Loader2, Sparkles, AlertTriangle, PackageSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import DecisionExplanation from '../components/ui/DecisionExplanation';

interface Material {
    _id: string;
    name: string;
    unit: string;
    quantity: number;
    minStock: number;
}

interface RequestItem {
    materialId: string;
    quantity: number;
}

const RaisePI = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [items, setItems] = useState<RequestItem[]>([{ materialId: '', quantity: 0 }]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const { data } = await api.get('/materials');
            setMaterials(data);
        } catch (error) {
            console.error('Failed to fetch materials', error);
        }
    };

    const handleItemChange = (index: number, field: keyof RequestItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { materialId: '', quantity: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        const validItems = items.filter(i => i.materialId && i.quantity > 0);
        if (validItems.length === 0) {
            setMessage({ text: 'Please add at least one valid material with quantity', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            await api.post('/pi', {
                items: validItems,
                reason
            });
            setMessage({ text: 'Product Inward Request Raised Successfully!', type: 'success' });
            setTimeout(() => navigate('/inventory'), 2000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || 'Failed to raise PI', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- Smart Recommendations Logic ---
    const recommendOrder = () => {
        const lowStockItems = materials.filter(m => m.quantity <= m.minStock);
        if (lowStockItems.length === 0) {
            setMessage({ text: 'Inventory is healthy! No low stock items found to recommend.', type: 'info' });
            return;
        }

        // Map to request items, suggesting order qty = minStock * 2 (simple logic)
        const recommendedItems = lowStockItems.map(m => ({
            materialId: m._id,
            quantity: m.minStock * 2
        }));

        setItems(recommendedItems);
        setReason('Auto-generated replenishment for low stock items.');
        setMessage({ text: `Auto-filled ${lowStockItems.length} items based on low stock alerts.`, type: 'success' });
    };

    const lowStockCount = materials.filter(m => m.quantity <= m.minStock).length;
    const deadStockCount = materials.filter(m => m.quantity > 0 && m.quantity === m.minStock * 5).length; // Mock logic for dead stock

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-10">

            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-indigo-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 font-heading">Raise Purchase Indent</h1>
                        <p className="text-slate-500 text-sm">Create a new procurement request for approval.</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-lg text-sm font-medium flex items-center gap-3 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            message.type === 'info' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {message.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                        {message.type === 'info' && <Sparkles className="h-4 w-4" />}
                        {message.text}
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Reason / Remarks</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                placeholder="e.g. Monthly Restock, Urgent Requirement for Batch 202"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Order Items</label>
                                <Button
                                    type="button"
                                    onClick={addItem}
                                    variant="ghost"
                                    size="sm"
                                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Row
                                </Button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-start bg-slate-50 p-4 rounded-lg border border-slate-100 transition-all hover:border-slate-300">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Material</label>
                                        <select
                                            value={item.materialId}
                                            onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                            className="w-full p-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        >
                                            <option value="">Select Material...</option>
                                            {materials.map((m) => (
                                                <option key={m._id} value={m._id}>
                                                    {m.name} (Cur: {m.quantity} {m.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                            className="w-full p-2 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="mt-6 p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Remove Item"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full sm:w-auto"
                            >
                                <Save className="h-4 w-4 mr-2" /> Submit Purchase Indent
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Column: Intelligent Recommendations */}
            <div className="space-y-6">
                {/* Smart Assistant Card */}
                <div className="industrial-card p-6 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-indigo-500 rounded-full opacity-20 blur-xl"></div>

                    <div className="relative z-10">
                        <h3 className="tex-lg font-bold font-heading flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-yellow-400" />
                            Smart Assistant
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                                <span className="text-slate-300">Materials Below Min. Stock</span>
                                <span className="font-bold text-rose-400">{lowStockCount} Items</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                                <span className="text-slate-300">Recommended Action</span>
                                <span className="font-bold text-emerald-400">Restock Immediately</span>
                            </div>
                        </div>

                        <Button
                            onClick={recommendOrder}
                            variant="primary"
                            className="w-full bg-white text-slate-900 hover:bg-slate-100"
                        >
                            <PackageSearch className="h-4 w-4 mr-2" />
                            Auto-Fill Recommended
                        </Button>
                    </div>
                </div>

                {/* Critical Alerts using Decision Explanation */}
                {lowStockCount > 0 && (
                    <DecisionExplanation
                        status="critical"
                        title="Creation of PI Recommended"
                        reasons={[
                            `${lowStockCount} items have fallen below safety thresholds.`,
                            "Lead times for these items average 5 days."
                        ]}
                        action="Use 'Auto-Fill Recommended' to quickly generate a restock PI."
                        impact="Delaying this order may result in stockouts by next week."
                    />
                )}
            </div>
        </div>
    );
};

export default RaisePI;
