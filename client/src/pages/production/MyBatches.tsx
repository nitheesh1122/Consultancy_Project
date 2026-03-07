import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Activity, Play, Plus } from 'lucide-react';
import api from '../../lib/api';

const MyBatches = () => {
 const navigate = useNavigate();

 const { data: batches = [], isLoading } = useQuery({
 queryKey: ['production-batches'],
 queryFn: async () => {
 const res = await api.get('/production-batches');
 // In a real app with proper my-assignments endpoint, we would filter on backend.
 // For now, GET /production-batches returns all, we filter by SCHEDULED / IN_PROGRESS
 return res.data;
 }
 });

 const activeBatches = batches.filter((b: any) => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
 case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
 case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
 default: return 'bg-surface-highlight text-primary border-border';
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
 <Activity className="h-6 w-6 text-primary" />
 My Batches
 </h2>
 <p className="text-secondary">Manage your currently assigned production batches</p>
 </div>
 <button
 onClick={() => navigate('/production/schedule')}
 className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition"
 >
 <Plus className="h-4 w-4" /> Schedule New
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {isLoading ? (
 <div className="col-span-full text-center py-12 text-secondary">Loading your batches...</div>
 ) : activeBatches.length === 0 ? (
 <div className="col-span-full text-center py-12 bg-surface rounded-xl shadow-sm border border-border text-secondary">
 No active or scheduled batches found. Click "Schedule New" to begin.
 </div>
 ) : (
 activeBatches.map((batch: any) => (
 <div key={batch._id} className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition">
 <div className={`px-4 py-3 border-b flex justify-between items-center ${batch.status === 'IN_PROGRESS' ? 'bg-blue-50/50' : ''}`}>
 <h3 className="font-bold font-mono text-primary">{batch.batchNumber}</h3>
 <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(batch.status)}`}>
 {batch.status.replace('_', ' ')}
 </span>
 </div>
 <div className="p-4 space-y-3">
 <div className="grid grid-cols-2 gap-2 text-sm">
 <div className="text-secondary">Machine:</div>
 <div className="font-medium text-primary text-right">{batch.machineId?.name || 'Unknown'}</div>

 <div className="text-secondary">Lot & Fabric:</div>
 <div className="font-medium text-primary text-right">{batch.lotNumber} ({batch.fabricType})</div>

 <div className="text-secondary">Input Kg:</div>
 <div className="font-medium text-primary text-right">{batch.inputKg} kg ({batch.rolls} rolls)</div>

 <div className="text-secondary">Shade:</div>
 <div className="font-medium text-primary text-right">{batch.shadeTarget}</div>
 </div>
 </div>
 <div className="px-4 py-3 bg-background border-t flex justify-end">
 <button
 onClick={() => navigate(`/production/batch/${batch._id}/execute`)}
 className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition w-full justify-center shadow-sm"
 >
 {batch.status === 'SCHEDULED' ? (
 <><Play className="h-4 w-4" /> Start Execution</>
 ) : (
 <><Activity className="h-4 w-4" /> Go to Execution View</>
 )}
 </button>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Show recently completed batches briefly at the bottom */}
 <div className="pt-8">
 <h3 className="text-lg font-bold text-primary mb-4">Recently Completed</h3>
 <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-background">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Batch Number</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Date</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Machine</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Yield</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Input</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {batches.filter((b: any) => b.status === 'COMPLETED').slice(0, 5).map((batch: any) => (
 <tr key={batch._id} className="hover:bg-background cursor-pointer" onClick={() => navigate(`/production/batch/${batch._id}/execute`)}>
 <td className="px-6 py-4 whitespace-nowrap font-medium font-mono text-primary">{batch.batchNumber}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{new Date(batch.scheduledDate).toLocaleDateString()}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">{batch.machineId?.name}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-success">{batch.qualityYieldPercentage || batch.yieldPercentage}%</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{batch.inputKg} kg</td>
 </tr>
 ))}
 {batches.filter((b: any) => b.status === 'COMPLETED').length === 0 && (
 <tr><td colSpan={5} className="text-center py-4 text-secondary">No completed batches today.</td></tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
};

export default MyBatches;
