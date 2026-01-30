import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Material {
    _id: string;
    name: string;
    unit: string;
}

interface RequestItem {
    materialId: string;
    quantityRequested: number;
}

const RequestMaterial = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [batchId, setBatchId] = useState('');
    const [items, setItems] = useState<RequestItem[]>([{ materialId: '', quantityRequested: 0 }]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const { data } = await api.get('/materials');
                setMaterials(data);
            } catch (error) {
                console.error('Failed to fetch materials', error);
            }
        };
        fetchMaterials();
    }, []);

    const handleItemChange = (index: number, field: keyof RequestItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { materialId: '', quantityRequested: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        // Validation
        if (!batchId) {
            setMessage({ text: 'Batch ID is required', type: 'error' });
            setLoading(false);
            return;
        }
        const validItems = items.filter(i => i.materialId && i.quantityRequested > 0);
        if (validItems.length === 0) {
            setMessage({ text: 'Please add at least one valid material with quantity', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            await api.post('/mrs', {
                batchId,
                items: validItems
            });
            setMessage({ text: 'Material Request Created Successfully!', type: 'success' });
            setTimeout(() => navigate('/'), 2000);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.message || 'Failed to create request', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Material Request (MRS)</h2>

            {message.text && (
                <div className={`p-4 rounded mb-4 ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID / Lot Number</label>
                    <input
                        type="text"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. BATCH-2023-001"
                        required
                    />
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <label className="block text-sm font-medium text-gray-700">Materials List</label>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Item
                        </button>
                    </div>

                    {items.map((item, index) => (
                        <div key={index} className="flex gap-4 items-end bg-gray-50 p-3 rounded">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Material</label>
                                <select
                                    value={item.materialId}
                                    onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                >
                                    <option value="">Select Material</option>
                                    {materials.map((m) => (
                                        <option key={m._id} value={m._id}>
                                            {m.name} ({m.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.quantityRequested}
                                    onChange={(e) => handleItemChange(index, 'quantityRequested', parseFloat(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-2 text-red-500 hover:text-red-700"
                                title="Remove Item"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RequestMaterial;
