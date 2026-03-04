import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const AnalyticsWorkers = () => {
 const { data: performance = [], isLoading: isLoadingPerf } = useQuery({
 queryKey: ['worker-performance'],
 queryFn: async () => {
 const res = await api.get('/analytics/workers/performance');
 return res.data;
 }
 });

 const { data: efficiency = [], isLoading: isLoadingEff } = useQuery({
 queryKey: ['worker-efficiency'],
 queryFn: async () => {
 const res = await api.get('/analytics/workers/efficiency');
 return res.data;
 }
 });

 if (isLoadingPerf || isLoadingEff) {
 return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
 }

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
 <div className="px-5 py-4 border-b border-subtle bg-canvas/50">
 <h3 className="font-bold text-primary flex items-center gap-2">
 <Activity className="h-5 w-5 text-primary" /> Supervisor Yield Output
 </h3>
 </div>
 {performance.length === 0 ? (
 <div className="p-8 text-center text-secondary">No batch data available.</div>
 ) : (
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-canvas">
 <tr>
 <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase">Supervisor</th>
 <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase">Batches</th>
 <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase">Avg Yield</th>
 <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase">Avg Wastage</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {performance.map((p: any) => (
 <tr key={p.supervisorName}>
 <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-primary">{p.supervisorName}</td>
 <td className="px-5 py-3 whitespace-nowrap text-right text-sm text-secondary">{p.totalBatches}</td>
 <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-status-success">{p.avgYield}%</td>
 <td className="px-5 py-3 whitespace-nowrap text-right font-medium text-status-danger">{p.avgWastage}%</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>

 <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
 <div className="px-5 py-4 border-b border-subtle bg-canvas/50">
 <h3 className="font-bold text-primary flex items-center gap-2">
 <Users className="h-5 w-5 text-primary" /> Worker Efficiency
 </h3>
 </div>
 {efficiency.length === 0 ? (
 <div className="p-8 text-center text-secondary">No worker allocation data available.</div>
 ) : (
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-canvas">
 <tr>
 <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase">Worker</th>
 <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase">Role</th>
 <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase">Batches Involved</th>
 <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase">Avg Yield</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {efficiency.map((w: any) => (
 <tr key={w.workerName}>
 <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-primary">{w.workerName}</td>
 <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-secondary">{w.workerRole}</td>
 <td className="px-5 py-3 whitespace-nowrap text-right text-sm text-secondary">{w.totalBatches}</td>
 <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-primary">{w.avgYield}%</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>
 </div>
 );
};

export default AnalyticsWorkers;
