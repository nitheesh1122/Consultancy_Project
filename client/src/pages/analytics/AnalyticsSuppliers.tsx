import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, ShieldAlert, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import DecisionExplanation from '../../components/ui/DecisionExplanation';
import MetricCard from '../../components/ui/MetricCard';

const AnalyticsSuppliers = () => {
    const { data: quality = [], isLoading: isQualityLoading } = useQuery({
        queryKey: ['supplier-quality'],
        queryFn: async () => {
            const res = await api.get('/analytics/suppliers/quality');
            return res.data;
        }
    });

    const { data: procurement, isLoading: isProcurementLoading } = useQuery({
        queryKey: ['procurement-performance'],
        queryFn: async () => {
            const res = await api.get('/analytics/procurement-performance');
            return res.data;
        }
    });

    if (isQualityLoading || isProcurementLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;
    }

    const { metrics = { avgApprovalTime: 0, avgCompletionTime: 0 }, delayedPIs = [] } = procurement || {};

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2 border-b pb-2">
                    Procurement & Supplier Performance
                </h2>
            </div>

            {/* PROCUREMENT PERFORMANCE */}
            <div className="space-y-6">
                <DecisionExplanation
                    status={delayedPIs.length > 0 ? "warning" : "good"}
                    title="Procurement Efficiency Status"
                    reasons={[
                        `Average approval time: ${metrics.avgApprovalTime.toFixed(1)} days.`,
                        `${delayedPIs.length} orders currently delayed.`
                    ]}
                    action={delayedPIs.length > 0 ? "Follow up with suppliers for delayed PIs." : "Procurement cycle is operating smoothly."}
                    impact="Delays increase risk of material shortage and production line halts."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard title="Avg Approval Time" value={`${metrics.avgApprovalTime.toFixed(1)} Days`} icon={Clock} />
                    <MetricCard title="Avg Completion Time" value={`${metrics.avgCompletionTime.toFixed(1)} Days`} icon={CheckCircle} />
                    <MetricCard title="Delayed Orders" value={delayedPIs.length} icon={AlertCircle} status={delayedPIs.length > 0 ? "critical" : "default"} />
                </div>
            </div>

            {/* SUPPLIER QUALITY */}
            <div className="space-y-6 pt-4 border-t border-slate-200">
                <h3 className="text-xl font-bold font-heading text-slate-900 border-b pb-2">Material Quality by Supplier</h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-5xl">
                    <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50/50">
                        <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-indigo-600" /> Quality Rejection Rates
                        </h3>
                    </div>
                    {quality.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No supplier batch data available.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-5 py-4 text-left font-bold text-slate-500 uppercase text-xs tracking-wider">Supplier Party</th>
                                    <th className="px-5 py-4 text-right font-bold text-slate-500 uppercase text-xs tracking-wider">Production Batches</th>
                                    <th className="px-5 py-4 text-right font-bold text-slate-500 uppercase text-xs tracking-wider">Total Input (Kg)</th>
                                    <th className="px-5 py-4 text-right font-bold text-slate-500 uppercase text-xs tracking-wider">Rejected (Kg)</th>
                                    <th className="px-5 py-4 text-right font-bold text-slate-500 uppercase text-xs tracking-wider">Rejection Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-slate-50/20">
                                {quality.map((s: any) => (
                                    <tr key={s.supplierName} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{s.supplierName}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm text-slate-500 font-mono">{s.totalBatches}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-700 font-mono">{s.totalInputKg.toLocaleString()}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-bold text-rose-600 font-mono">{s.totalRejectionKg.toLocaleString()}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {s.rejectionRate > 5 && <ShieldAlert className="h-4 w-4 text-red-500" />}
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${s.rejectionRate > 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{s.rejectionRate}%</span>
                                            </div>
                                        </td>
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

export default AnalyticsSuppliers;
