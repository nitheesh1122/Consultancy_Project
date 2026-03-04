import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, History, Package } from 'lucide-react';

const MaterialDetails = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const [material, setMaterial] = useState<any>(null);
 const [transactions, setTransactions] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchHistory();
 }, [id]);

 const fetchHistory = async () => {
 try {
 const { data } = await api.get(`/transactions/${id}`);
 setMaterial(data.material);
 setTransactions(data.transactions);
 } catch (error) {
 console.error('Failed to fetch history');
 } finally {
 setLoading(false);
 }
 };

 if (loading) return <div className="p-8">Loading History...</div>;
 if (!material) return <div className="p-8">Material not found</div>;

 return (
 <div className="space-y-6">
 <button onClick={() => navigate(-1)} className="flex items-center text-secondary hover:text-primary">
 <ArrowLeft className="w-4 h-4 mr-1" /> Back to Inventory
 </button>

 <div className="bg-surface rounded-lg shadow p-6 border-l-4 border-primary">
 <div className="flex items-start justify-between">
 <div>
 <h1 className="text-2xl font-bold text-primary flex items-center">
 <Package className="w-6 h-6 mr-2 text-primary" />
 {material.name}
 </h1>
 <p className="text-secondary mt-1">Unit: {material.unit}</p>
 {(() => {
 const lastInward = transactions.find(t => t.type === 'INWARD');
 return (
 <p className="text-xs text-muted mt-1">
 {lastInward
 ? `Last purchased: ${Math.floor((new Date().getTime() - new Date(lastInward.timestamp).getTime()) / (1000 * 3600 * 24))} days ago`
 : 'This material has never been procured.'}
 </p>
 );
 })()}
 </div>
 </div>
 </div>

 <div className="bg-surface rounded-lg shadow overflow-hidden">
 <div className="px-6 py-4 border-b border-border flex items-center bg-background">
 <History className="w-5 h-5 mr-2 text-secondary" />
 <h3 className="font-bold text-primary">Transaction History (Stock Card)</h3>
 </div>
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-background">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Date/Time</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Type</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Performed By</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase">Quantity</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {transactions.map((tx) => (
 <tr key={tx._id} className="hover:bg-background">
 <td className="px-6 py-4 text-sm text-primary">
 {new Date(tx.timestamp).toLocaleString()}
 </td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tx.type === 'INWARD' ? 'bg-green-100 text-green-800' :
 tx.type === 'ISSUE' ? 'bg-red-100 text-red-800' : 'bg-surface-highlight'
 }`}>
 {tx.type}
 </span>
 </td>
 <td className="px-6 py-4 text-sm text-secondary">
 {tx.performedBy?.username || 'System'}
 </td>
 <td className={`px-6 py-4 text-sm font-bold text-right ${tx.quantity > 0 ? 'text-success' : 'text-danger'}`}>
 {tx.quantity > 0 ? '+' : ''}{tx.quantity}
 </td>
 </tr>
 ))}
 {transactions.length === 0 && (
 <tr>
 <td colSpan={4} className="px-6 py-8 text-center text-secondary">
 No transactions recorded yet.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default MaterialDetails;
