import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { RefreshCw, Search, Save, AlertCircle } from 'lucide-react';

interface Material {
    _id: string;
    name: string;
    unit: string;
}

const ReturnMaterial = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const { data } = await api.get('/materials');
                setMaterials(data);
            } catch (error) {
                console.error("Failed to fetch materials");
            }
        };
        fetchMaterials();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        if (quantity <= 0) {
            setMessage({ text: 'Quantity must be greater than 0', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            await api.post('/mrs/return', {
                items: [{ materialId: selectedMaterialId, quantity }],
                reason
            });
            setMessage({ text: 'Material Returned Successfully!', type: 'success' });
            // Reset form
            setSelectedMaterialId('');
            setQuantity(0);
            setReason('');
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || 'Failed to return material', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-10">
            <h2 className="text-2xl font-bold font-heading text-slate-800 flex items-center gap-2 mb-6">
                <RefreshCw className="h-6 w-6 text-indigo-600" />
                Return Excess Material
            </h2>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 flex items-center ${message.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {message.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Select Material</label>
                        <select
                            value={selectedMaterialId}
                            onChange={(e) => setSelectedMaterialId(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            required
                        >
                            <option value="">Choose Material to Return...</option>
                            {materials.map(m => (
                                <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Quantity to Return</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value))}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Reason (Optional)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24"
                            placeholder="e.g. Excess from Batch 102..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Save className="h-5 w-5" /> Confirm Return
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReturnMaterial;
