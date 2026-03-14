import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { ShiftComparisonChart } from '../../components/Charts';

const AnalyticsWorkers = () => {
    const { data: performance = [], isLoading: isLoadingPerf } = useQuery({
        queryKey: ['worker-performance'],
        queryFn: async () => (await api.get('/analytics/workers/performance')).data
    });

    const { data: efficiency = [], isLoading: isLoadingEff } = useQuery({
        queryKey: ['worker-efficiency'],
        queryFn: async () => (await api.get('/analytics/workers/efficiency')).data
    });

    const { data: shiftData = [], isLoading: isLoadingShift } = useQuery({
        queryKey: ['shift-analysis'],
        queryFn: async () => (await api.get('/analytics/shift-analysis')).data
    });

    if (isLoadingPerf || isLoadingEff || isLoadingShift) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    // Anomaly detection on supervisors: flag if yield < (mean - 1.5Ïƒ)
    const yields: number[] = performance.map((p: any) => p.avgYield ?? 0);
    const mean = yields.length ? yields.reduce((s, v) => s + v, 0) / yields.length : 0;
    const stddev = yields.length > 1 ? Math.sqrt(yields.reduce((s, v) => s + (v - mean) ** 2, 0) / yields.length) : 0;
    const anomalyThreshold = mean - 1.5 * stddev;

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* â”€â”€ Shift Performance Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {shiftData.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold font-heading text-primary border-b border-subtle pb-2">Shift-Level Performance</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card rounded-xl shadow-lg border border-subtle p-6">
                            <h4 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">Yield Â· Rejection Â· Wastage by Shift</h4>
                            <ShiftComparisonChart data={shiftData} />
                        </div>
                        <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden">
                            <div className="px-6 py-4 border-b border-subtle bg-canvas/50">
                                <h4 className="text-sm font-bold text-primary uppercase tracking-wide">Shift Metrics Summary</h4>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-elevated border-b border-subtle">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Shift</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Batches</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Avg Yield</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">1st Pass %</th>
                                        <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Rejection</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle">
                                    {shiftData.map((s: any) => (
                                        <tr key={s.shift} className="hover:bg-canvas/50">
                                            <td className="px-5 py-3 font-bold text-primary font-heading">{s.shift}</td>
                                            <td className="px-5 py-3 text-right font-mono text-secondary">{s.totalBatches}</td>
                                            <td className={`px-5 py-3 text-right font-black font-mono ${s.avgYield >= 85 ? 'text-status-success' : 'text-status-warning'}`}>{s.avgYield}%</td>
                                            <td className="px-5 py-3 text-right font-mono text-secondary">{s.firstPassYield}%</td>
                                            <td className={`px-5 py-3 text-right font-bold font-mono ${s.rejectionRate > 5 ? 'text-status-danger' : 'text-secondary'}`}>{s.rejectionRate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* â”€â”€ Supervisor Tables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Supervisor Performance with anomaly flag */}
                <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                    <div className="px-5 py-4 border-b border-subtle bg-canvas/50">
                        <h3 className="font-bold text-primary flex items-center gap-2">
                            <Activity className="h-5 w-5" /> Supervisor Yield Output
                        </h3>
                        {stddev > 0 && <p className="text-[10px] text-muted font-mono mt-1">âš  Flagged: yield &lt; {anomalyThreshold.toFixed(1)}% (mean âˆ’ 1.5Ïƒ)</p>}
                    </div>
                    {performance.length === 0 ? (
                        <div className="p-8 text-center text-secondary">No batch data available.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-subtle text-sm">
                            <thead className="bg-elevated border-b border-subtle">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Supervisor</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Batches</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Avg Yield</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Avg Wastage</th>
                                    <th className="px-5 py-3 text-center text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-subtle">
                                {performance.map((p: any) => {
                                    const isAnomaly = stddev > 0 && (p.avgYield ?? 0) < anomalyThreshold;
                                    return (
                                        <tr key={p.supervisorName} className={isAnomaly ? 'bg-status-danger/5' : 'hover:bg-canvas/50'}>
                                            <td className="px-5 py-3 font-medium text-primary whitespace-nowrap">{p.supervisorName}</td>
                                            <td className="px-5 py-3 text-right text-secondary font-mono">{p.totalBatches}</td>
                                            <td className={`px-5 py-3 text-right font-black font-mono ${isAnomaly ? 'text-status-danger' : 'text-status-success'}`}>{p.avgYield}%</td>
                                            <td className="px-5 py-3 text-right font-medium text-status-danger font-mono">{p.avgWastage}%</td>
                                            <td className="px-5 py-3 text-center">
                                                {isAnomaly && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-danger/10 border border-status-danger/30 text-status-danger text-[10px] font-bold uppercase"><AlertTriangle className="h-3 w-3" />Low</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Worker Efficiency */}
                <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                    <div className="px-5 py-4 border-b border-subtle bg-canvas/50">
                        <h3 className="font-bold text-primary flex items-center gap-2">
                            <Users className="h-5 w-5" /> Worker Efficiency
                        </h3>
                    </div>
                    {efficiency.length === 0 ? (
                        <div className="p-8 text-center text-secondary">No worker allocation data available.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-subtle text-sm">
                            <thead className="bg-elevated border-b border-subtle">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Worker</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Role</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Batches</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Avg Yield</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-subtle">
                                {efficiency.map((w: any) => (
                                    <tr key={w.workerName} className="hover:bg-canvas/50">
                                        <td className="px-5 py-3 font-medium text-primary whitespace-nowrap">{w.workerName}</td>
                                        <td className="px-5 py-3 text-xs font-semibold text-secondary">{w.workerRole}</td>
                                        <td className="px-5 py-3 text-right text-secondary font-mono">{w.totalBatches}</td>
                                        <td className="px-5 py-3 text-right font-bold text-primary font-mono">{w.avgYield}%</td>
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
