import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, Trash2, Save, History, ClipboardList, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequestTimeline from '../components/RequestTimeline';

interface Material {
 _id: string;
 name: string;
 unit: string;
 quantity: number;
}

interface RequestItem {
 materialId: string;
 quantityRequested: number;
}

interface MRSHistoryItem {
 _id: string;
 batchId: string;
 status: string;
 createdAt: string;
 items: { materialId: { name: string; unit: string }; quantityRequested: number; quantityIssued: number }[];
}

const RequestMaterial = () => {
 const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
 const [materials, setMaterials] = useState<Material[]>([]);
 const [batchId, setBatchId] = useState('');
 const [items, setItems] = useState<RequestItem[]>([{ materialId: '', quantityRequested: 0 }]);
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState({ text: '', type: '' });
 const [mrsHistory, setMrsHistory] = useState<MRSHistoryItem[]>([]);
 const [historyLoading, setHistoryLoading] = useState(false);
 const navigate = useNavigate();

 useEffect(() => {
 fetchMaterials();
 }, []);

 useEffect(() => {
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
 const { data } = await api.get('/mrs/my');
 setMrsHistory(data);
 } catch (error) {
 console.error('Failed to fetch MRS history', error);
 } finally {
 setHistoryLoading(false);
 }
 };

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
 // Check if items are within stock limits
 const invalidItems = items.filter(item => {
 const material = materials.find(m => m._id === item.materialId);
 return material && item.quantityRequested > material.quantity;
 });

 if (invalidItems.length > 0) {
 const invalidNames = invalidItems.map(i => materials.find(m => m._id === i.materialId)?.name).join(', ');
 setMessage({
 text: `Validation Failed: Requested quantity exceeds stock for: ${invalidNames}`,
 type: 'error'
 });
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
 setTimeout(() => {
 setMessage({ text: '', type: '' });
 setActiveTab('HISTORY');
 setItems([{ materialId: '', quantityRequested: 0 }]);
 setBatchId('');
 }, 1000);
 } catch (error: any) {
 setMessage({ text: error.response?.data?.message || 'Failed to create request', type: 'error' });
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-5xl mx-auto pb-12">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="text-2xl font-bold text-primary">Material Requisition</h2>
 <p className="text-secondary text-sm">Create and track material requests for production.</p>
 </div>

 <div className="flex bg-surface-highlight p-1 rounded-lg">
 <button
 onClick={() => setActiveTab('NEW')}
 className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'NEW'
 ? 'bg-surface text-primary shadow-sm'
 : 'text-secondary hover:text-primary'
 }`}
 >
 <Plus className="h-4 w-4 inline mr-1" /> New Request
 </button>
 <button
 onClick={() => setActiveTab('HISTORY')}
 className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'HISTORY'
 ? 'bg-surface text-primary shadow-sm'
 : 'text-secondary hover:text-primary'
 }`}
 >
 <History className="h-4 w-4 inline mr-1" /> History
 </button>
 </div>
 </div>

 {activeTab === 'NEW' ? (
 <div className="bg-surface p-8 rounded-xl shadow-sm border border-border animate-fade-in">
 {message.text && (
 <div className={`p-4 rounded-lg mb-6 flex items-center ${message.type === 'error' ? 'bg-danger/10 text-red-700' : 'bg-green-50 text-green-700'}`}>
 {message.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
 {message.type === 'success' && <Save className="h-5 w-5 mr-2" />}
 {message.text}
 </div>
 )}

 <form onSubmit={handleSubmit}>
 <div className="mb-6">
 <label className="block text-xs font-bold text-secondary uppercase tracking-wide mb-1">Batch ID / Lot Number</label>
 <input
 type="text"
 value={batchId}
 onChange={(e) => setBatchId(e.target.value)}
 className="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
 placeholder="e.g. BATCH-2023-001"
 required
 />
 </div>

 <div className="space-y-4 mb-8">
 <div className="flex justify-between items-center border-b pb-2">
 <label className="block text-xs font-bold text-secondary uppercase tracking-wide">Materials List</label>
 <button
 type="button"
 onClick={addItem}
 className="flex items-center text-sm font-medium text-primary hover:text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
 >
 <Plus className="h-4 w-4 mr-1" /> Add Item
 </button>
 </div>

 {items.map((item, index) => (
 <div key={index} className="flex gap-4 items-end bg-background p-4 rounded-lg border border-border">
 <div className="flex-1">
 <label className="block text-xs text-secondary mb-1">Material</label>
 <select
 value={item.materialId}
 onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
 className="w-full p-2 bg-surface border border-border rounded text-sm focus:outline-none focus:border-primary"
 aria-label="Material"
 >
 <option value="">Select Material...</option>
 {materials.map((m) => (
 <option key={m._id} value={m._id}>
 {m.name} (Stock: {m.quantity} {m.unit})
 </option>
 ))}
 </select>
 </div>
 <div className="w-32">
 <label className="block text-xs text-secondary mb-1" htmlFor={`req-qty-${index}`}>Quantity</label>
 <input
 id={`req-qty-${index}`}
 type="number"
 min="0"
 step="0.01"
 value={item.quantityRequested}
 onChange={(e) => handleItemChange(index, 'quantityRequested', parseFloat(e.target.value))}
 className="w-full p-2 bg-surface border border-border rounded text-sm focus:outline-none focus:border-primary"
 aria-label="Quantity requested"
 />
 </div>
 <button
 type="button"
 onClick={() => removeItem(index)}
 className="mb-1 p-2 text-muted hover:text-danger transition-colors"
 title="Remove Item"
 >
 <Trash2 className="h-5 w-5" />
 </button>
 </div>
 ))}
 </div>

 <div className="flex justify-end border-t pt-6">
 <button
 type="submit"
 disabled={loading}
 className="flex items-center px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 font-medium shadow-sm transition-all hover:shadow-md"
 >
 {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
 {loading ? 'Submitting...' : 'Submit Request'}
 </button>
 </div>
 </form>
 </div>
 ) : (
 <div className="bg-surface rounded-xl shadow-sm border border-border p-6 animate-fade-in">
 {historyLoading ? (
 <div className="flex justify-center py-12">
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 </div>
 ) : (
 <div className="space-y-6">
 {mrsHistory.length === 0 ? (
 <div className="text-center py-12 text-secondary">
 <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted" />
 <p>No Requisition History Found.</p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {mrsHistory.map(mrs => (
 <div key={mrs._id} className="py-4">
 <div className="flex justify-between items-start mb-2">
 <div>
 <span className="text-xs font-bold text-muted uppercase tracking-widest">{mrs.batchId}</span>
 <h4 className="font-medium text-primary mt-1">
 Req #{mrs._id.slice(-6).toUpperCase()}
 </h4>
 </div>
 <div className="flex flex-col items-end gap-2">
 <RequestTimeline status={mrs.status} createdAt={mrs.createdAt} />
 </div>
 </div>

 <div className="bg-background rounded p-3 mt-2">
 <table className="w-full text-sm">
 <tbody>
 {mrs.items.map((item, idx) => (
 <tr key={idx} className="border-b last:border-0 border-border">
 <td className="py-1 text-primary">{item.materialId?.name || 'Unknown'}</td>
 <td className="py-1 text-right text-secondary">
 Required: <span className="font-medium text-primary">{item.quantityRequested}</span>
 </td>
 <td className="py-1 text-right text-secondary">
 Issued: <span className={`font-medium ${item.quantityIssued >= item.quantityRequested ? 'text-success' : 'text-warning'}`}>{item.quantityIssued || 0}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
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

export default RequestMaterial;
