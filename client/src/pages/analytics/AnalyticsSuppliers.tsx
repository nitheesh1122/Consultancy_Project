import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, ShieldAlert, Loader2, Clock, CheckCircle, AlertCircle, BarChart2 } from 'lucide-react';
import api from '../../lib/api';
import DecisionExplanation from '../../components/ui/DecisionExplanation';
import MetricCard from '../../components/ui/MetricCard';
import { SupplierScatterChart, ParetoChart } from '../../components/Charts';

const AnalyticsSuppliers = () => {
    const { data: quality = [], isLoading: isQualityLoading } = useQuery({
        queryKey: ['supplier-quality'],
        queryFn: async () => (await api.get('/analytics/suppliers/quality')).data
    });

    const { data: procurement, isLoading: isProcurementLoading } = useQuery({
        queryKey: ['procurement-performance'],
        queryFn: async () => (await api.get('/analytics/procurement-performance')).data
    });

    if (isQualityLoading || isProcurementLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    const { metrics = { avgApprovalTime: 0, avgCompletionTime: 0 }, delayedPIs = [] } = procurement || {};

    // Pareto data: suppliers sorted by total rejection kg
    const paretoData = quality
        .filter((s: any) => s.totalRejectionKg > 0)
        .map((s: any) => ({ name: (s.supplierName ?? 'Unknown').slice(0, 12), value: Math.round(s.totalRejectionKg) }));

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2 border-b pb-2">
                    Procurement &amp; Supplier Performance
                </h2>
            </div>

            {/* â”€â”€ Procurement KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="space-y-6">
                <DecisionExplanation
                    status={delayedPIs.length > 0 ? "warning" : "good"}
                    title="Procurement Efficiency Status"
                    reasons={[`Average approval time: ${metrics.avgApprovalTime?.toFixed(1) ?? 0} days.`, `${delayedPIs.length} orders currently delayed.`]}
                    action={delayedPIs.length > 0 ? "Follow up with suppliers for delayed PIs." : "Procurement cycle is operating smoothly."}
                    impact="Delays increase risk of material shortage and production line halts."
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard title="Avg Approval Time" value={`${metrics.avgApprovalTime?.toFixed(1) ?? 0} Days`} icon={Clock} />
                    <MetricCard title="Avg Completion Time" value={`${metrics.avgCompletionTime?.toFixed(1) ?? 0} Days`} icon={CheckCircle} />
                    <MetricCard title="Delayed Orders" value={delayedPIs.length} icon={AlertCircle} status={delayedPIs.length > 0 ? "critical" : "default"} />
                </div>
            </div>

            {/* â”€â”€ Supplier Quality Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="space-y-6 pt-4 border-t border-subtle">
                <h3 className="text-xl font-bold font-heading text-primary border-b pb-2">Material Quality by Supplier</h3>
                {quality.length === 0 ? (
                    <div className="p-8 text-center text-secondary bg-card rounded-xl border border-subtle">No supplier batch data available.</div>
                ) : (
                    <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-subtle text-sm text-left">
                                <thead className="bg-elevated border-b border-subtle">
                                    <tr>
                                        <th className="px-5 py-4 text-left font-bold text-secondary uppercase text-xs tracking-wider">Supplier</th>
                                        <th className="px-5 py-4 text-right font-bold text-secondary uppercase text-xs tracking-wider">Batches</th>
                                        <th className="px-5 py-4 text-right font-bold text-secondary uppercase text-xs tracking-wider">Total Input (kg)</th>
                                        <th className="px-5 py-4 text-right font-bold text-secondary uppercase text-xs tracking-wider">Rejected (kg)</th>
                                        <th className="px-5 py-4 text-right font-bold text-secondary uppercase text-xs tracking-wider">Rejection Rate</th>
                                        <th className="px-5 py-4 text-right font-bold text-secondary uppercase text-xs tracking-wider">Avg Yield</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle bg-canvas/20">
                                    {quality.map((s: any) => (
                                        <tr key={s.supplierName} className="hover:bg-canvas transition-colors">
                                            <td className="px-5 py-4 font-bold text-primary whitespace-nowrap">{s.supplierName ?? 'â€”'}</td>
                                            <td className="px-5 py-4 text-right text-secondary font-mono">{s.totalBatches}</td>
                                            <td className="px-5 py-4 text-right font-medium text-primary font-mono">{s.totalInputKg?.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-right font-bold text-status-danger font-mono">{s.totalRejectionKg?.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {s.rejectionRate > 5 && <ShieldAlert className="h-4 w-4 text-status-danger" />}
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${s.rejectionRate > 5 ? 'bg-status-danger/20 text-status-danger' : 'bg-status-success/20 text-status-success'}`}>
                                                        {s.rejectionRate}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold font-mono text-status-success">{s.avgYield ?? 0}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* â”€â”€ Visualizations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {quality.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-subtle">
                    {/* Scatter: Rejection Rate vs Avg Yield */}
                    <div className="bg-card rounded-xl shadow-lg border border-subtle p-6">
                        <h3 className="text-base font-bold text-primary font-heading uppercase tracking-wide mb-1 flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-brand-primary" /> Quality vs Rejection (Scatter)
                        </h3>
                        <p className="text-[10px] text-muted font-mono mb-4">Bubble size = total batches. Ideal supplier: bottom-right (low rejection, high yield).</p>
                        <SupplierScatterChart data={quality.map((s: any) => ({
                            name: s.supplierName ?? 'Unknown',
                            rejectionRate: s.rejectionRate ?? 0,
                            avgYield: s.avgYield ?? 0,
                            totalBatches: s.totalBatches ?? 1
                        }))} />
                    </div>

                    {/* Pareto: rejection volume by supplier */}
                    {paretoData.length > 0 && (
                        <div className="bg-card rounded-xl shadow-lg border border-subtle p-6">
                            <h3 className="text-base font-bold text-primary font-heading uppercase tracking-wide mb-1 flex items-center gap-2">
                                <Truck className="h-5 w-5 text-brand-primary" /> Rejection Volume Pareto
                            </h3>
                            <p className="text-[10px] text-muted font-mono mb-4">Orange line = cumulative %. 80% rule: focus on left-most bars.</p>
                            <ParetoChart data={paretoData} valueLabel="Rejection kg" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyticsSuppliers;
