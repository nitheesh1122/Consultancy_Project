import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, Trash2, Save, ShoppingCart, Loader2, Sparkles, AlertTriangle, PackageSearch, History, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import DecisionExplanation from '../components/ui/DecisionExplanation';

interface Material {
    _id: string;
    name: string;
    unit: string;
    quantity: number;
    minStock: number;
    supplierId?: { name: string; rating?: number };
}

interface RequestItem {
    materialId: string;
    quantity: number;
}

interface PIHistoryItem {
    _id: string;
    createdAt: string;
    status: string;
    items: { materialId: { name: string; unit: string }; quantity: number }[];
    supplierId?: { name: string };
    reason?: string;
}

const RaisePI = () => {
    const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [items, setItems] = useState<RequestItem[]>([{ materialId: '', quantity: 0 }]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [piHistory, setPiHistory] = useState<PIHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMaterials();
        if (activeTab === 'HISTORY') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchMaterials = async () => {
        try {
            const { data } = await api.get('/materials');
            setMaterials(data);
        } catch (error) {
            console.error('Failed to fetch materials', error);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const { data } = await api.get('/pi');
            setPiHistory(data);
        } catch (error) {
            console.error('Failed to fetch PI history', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleItemChange = (index: number, field: keyof RequestItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
        setIsConfirming(false); // Reset confirmation if user edits form
    };

    const addItem = () => {
        setItems([...items, { materialId: '', quantity: 0 }]);
        setIsConfirming(false);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        setIsConfirming(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validItems = items.filter(i => i.materialId && i.quantity > 0);
        if (validItems.length === 0) {
            setMessage({ text: 'Please add at least one valid material with quantity', type: 'error' });
            return;
        }

        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await api.post('/pi', {
                items: validItems,
                reason
            });
            setMessage({ text: 'Product Inward Request Raised Successfully!', type: 'success' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
                setActiveTab('HISTORY');
                setItems([{ materialId: '', quantity: 0 }]);
                setReason('');
                setIsConfirming(false);
            }, 1000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || 'Failed to raise PI', type: 'error' });
            setIsConfirming(false);
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
        <div className="max-w-7xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-primary font-heading">Raise Purchase Indent</h1>
                        <p className="text-secondary text-sm">Create and manage procurement requests.</p>
                    </div>
                </div>

                <div className="flex bg-elevated p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('NEW')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'NEW'
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-secondary hover:text-primary'
                            }`}
                    >
                        <Plus className="h-4 w-4 inline mr-1" /> New Request
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'HISTORY'
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-secondary hover:text-primary'
                            }`}
                    >
                        <History className="h-4 w-4 inline mr-1" /> Request History
                    </button>
                </div>
            </div>

            {activeTab === 'NEW' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    {/* Left Column: Form */}
                    <div className={`transition-all duration-300 ${isAssistantOpen ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
                        {message.text && (
                            <div className={`p-4 rounded-lg text-sm font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-status-danger/10 text-status-danger border border-status-danger/30' :
                                message.type === 'info' ? 'bg-status-info/10 text-status-info border border-status-info/30' :
                                    'bg-status-success/10 text-status-success border border-status-success/30'
                                }`}>
                                {message.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                                {message.type === 'info' && <Sparkles className="h-4 w-4" />}
                                {message.text}
                            </div>
                        )}

                        <div className="bg-card p-6 rounded-xl shadow-lg border border-subtle">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Reason / Remarks</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-3 py-2 bg-canvas border border-subtle rounded-lg text-sm text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 min-h-[80px] transition-all"
                                        placeholder="e.g. Monthly Restock, Urgent Requirement for Batch 202"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-subtle pb-3">
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Order Items</label>
                                        <Button
                                            type="button"
                                            onClick={addItem}
                                            variant="secondary"
                                            size="sm"
                                            className="text-primary hover:text-brand-primary hover:border-brand-primary"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Row
                                        </Button>
                                    </div>

                                    {items.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-start bg-canvas p-4 rounded-lg border border-subtle group transition-all hover:border-brand-primary/30">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Material</label>
                                                <select
                                                    value={item.materialId}
                                                    onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                                    className="w-full p-2 bg-elevated border border-transparent rounded text-sm text-primary font-medium focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all"
                                                >
                                                    <option value="" className="text-secondary">Select Material...</option>
                                                    {materials.map((m) => (
                                                        <option key={m._id} value={m._id} className="text-primary">
                                                            {m.name} (Sup: {m.supplierId?.name || 'Unknown'}{m.supplierId?.rating ? ` ★${m.supplierId.rating.toFixed(1)}` : ''}) (Qty: {m.quantity})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                                    className="w-full p-2 bg-elevated border border-transparent rounded text-sm text-primary font-mono tabular-nums focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="mt-7 p-2 text-muted hover:text-status-danger hover:bg-status-danger/10 rounded transition-colors"
                                                title="Remove Item"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-subtle flex justify-end gap-3 items-center">
                                    {!isAssistantOpen && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setIsAssistantOpen(true)}
                                            className="text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10"
                                            size="sm"
                                        >
                                            <Sparkles className="h-4 w-4 mr-2" /> Show Assistant
                                        </Button>
                                    )}

                                    {isConfirming && (
                                        <span className="text-sm font-bold text-status-warning mr-2 animate-fade-in uppercase tracking-wider">
                                            Confirm indent details
                                        </span>
                                    )}
                                    <Button
                                        type="submit"
                                        isLoading={loading}
                                        variant={isConfirming ? "danger" : "primary"}
                                        className={`w-full sm:w-auto transition-all duration-300 font-bold ${isConfirming ? 'bg-status-warning text-slate-950 hover:bg-status-warning/90 border-transparent shadow-[0_0_15px_rgba(230,162,60,0.4)]' : ''}`}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isConfirming ? "Yes, Raise Indent" : "Submit Purchase Indent"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Intelligent Recommendations */}
                    {isAssistantOpen && (
                        <div className="space-y-6 lg:col-span-1 border-l border-subtle pl-8 animate-fade-in relative">
                            <button
                                onClick={() => setIsAssistantOpen(false)}
                                className="absolute -left-3 top-1/2 -mt-4 h-8 w-6 bg-card border border-subtle rounded flex items-center justify-center text-muted hover:text-primary transition-colors hover:bg-elevated z-10"
                                title="Hide Assistant"
                            >
                                <div className="w-1 h-3 border-l-2 border-r-2 border-muted" />
                            </button>
                            {/* Smart Assistant Card */}
                            <div className="industrial-card p-6 bg-elevated text-primary relative overflow-hidden border-brand-primary/20 shadow-[inset_0_0_20px_rgba(212,168,83,0.02)]">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-brand-primary rounded-full opacity-10 blur-2xl"></div>

                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold font-heading flex items-center gap-2 mb-4 text-brand-primary border-b border-brand-primary/20 pb-3">
                                        <Sparkles className="h-5 w-5" />
                                        Smart Assistant
                                    </h3>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center text-sm border-b border-subtle pb-2">
                                            <span className="text-muted font-medium">Below Min. Stock</span>
                                            <span className="font-bold text-status-danger font-mono tabular-nums bg-status-danger/10 px-2 py-0.5 rounded">{lowStockCount} Items</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-subtle pb-2">
                                            <span className="text-muted font-medium">Recommended Action</span>
                                            <span className="font-bold text-status-success uppercase tracking-wider text-[10px]">Restock Immediately</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={recommendOrder}
                                        variant="secondary"
                                        className="w-full bg-card text-brand-primary border-brand-primary/30 hover:border-brand-primary hover:bg-brand-primary/5 font-bold"
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
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-lg border border-subtle p-6 animate-fade-in">
                    {historyLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {piHistory.length === 0 ? (
                                <div className="text-center py-12 text-secondary">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted" />
                                    <p>No Request History Found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-subtle">
                                    {piHistory.map(pi => (
                                        <div key={pi._id} className="py-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary">
                                                        {pi._id.slice(-6)}
                                                    </span>
                                                    <span className="text-sm text-secondary">
                                                        {new Date(pi.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
 ${pi.status === 'RAISED' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                                                            pi.status === 'APPROVED' ? 'bg-status-success/10 text-status-success border-status-success/30' :
                                                                pi.status === 'COMPLETED' ? 'bg-status-info/10 text-status-info border-status-info/30' : 'bg-status-danger/10 text-status-danger border-status-danger/30'}`}>
                                                        {pi.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-primary">
                                                    {pi.supplierId?.name || 'Unknown Supplier'}
                                                </h4>
                                                <p className="text-sm text-secondary mt-1 line-clamp-1">{pi.reason}</p>
                                            </div>

                                            <div className="md:text-right">
                                                <div className="text-sm text-primary font-medium">{pi.items.length} Items</div>
                                                <div className="text-xs text-secondary mt-1">
                                                    {pi.items.slice(0, 2).map(i => `${i.materialId?.name || 'Unknown'} (${i.quantity})`).join(', ')}
                                                    {pi.items.length > 2 && '...'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RaisePI;
