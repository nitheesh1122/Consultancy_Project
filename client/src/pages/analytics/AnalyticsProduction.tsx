import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Activity, Percent, Flame, DollarSign, Layers, Loader2, AlertTriangle, Cpu } from 'lucide-react';
import api from '../../lib/api';
import { SimpleBarChart, ShiftComparisonChart, YieldBreakdownBar, ComposedBarMAChart, GaugeChart } from '../../components/Charts';

const AnalyticsProduction = () => {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const { data: batches = [], isLoading: isBatchesLoading } = useQuery({
        queryKey: ['production-analytics', dateRange],
        queryFn: async () => {
            const res = await api.get('/production-batches', {
                params: { startDate: dateRange.startDate, endDate: dateRange.endDate, status: 'COMPLETED' }
            });
            return res.data;
        }
    });

    const { data: efficiency } = useQuery({
        queryKey: ['efficiency-stats'],
        queryFn: async () => (await api.get('/analytics/efficiency')).data
    });

    const { data: cost } = useQuery({
        queryKey: ['cost-analytics'],
        queryFn: async () => (await api.get('/analytics/cost')).data
    });

    const { data: shiftData = [] } = useQuery({
        queryKey: ['shift-analysis'],
        queryFn: async () => (await api.get('/analytics/shift-analysis')).data
    });

    const { data: oeeData = [] } = useQuery({
        queryKey: ['oee-metrics'],
        queryFn: async () => (await api.get('/analytics/oee-metrics')).data
    });

    const { data: productionDashboard } = useQuery({
        queryKey: ['production-analytics-dashboard'],
        queryFn: async () => (await api.get('/production-analytics/dashboard')).data,
    });

    if (isBatchesLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    // â”€â”€ KPI Computation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const totalBatches = batches.length;
    const totalInput = batches.reduce((s: number, b: any) => s + (b.inputKg || 0), 0);
    const totalQualityOutput = batches.reduce((s: number, b: any) => s + (b.outputFirstGradeKg || 0) + (b.outputSecondGradeKg || 0), 0);
    const totalRejection = batches.reduce((s: number, b: any) => s + (b.rejectionKg || 0), 0);
    const totalUtilityCost = batches.reduce((s: number, b: any) => {
        const utilityCost = b?.calculatedCosts?.utilityCost ?? b?.utilities?.calculatedCost ?? 0;
        return s + utilityCost;
    }, 0);
    const avgYield = totalInput > 0 ? ((totalQualityOutput / totalInput) * 100).toFixed(2) : '0.00';
    const avgWastage = totalInput > 0 ? (((totalInput - totalQualityOutput - totalRejection) / totalInput) * 100).toFixed(2) : '0.00';

    // Anomaly detection: flag batches where yield is < (mean - 1.5Ã—stddev)
    const yields = batches.map((b: any) => b.qualityYieldPercentage || 0);
    const mean = yields.length ? yields.reduce((s: number, v: number) => s + v, 0) / yields.length : 0;
    const stddev = yields.length > 1
        ? Math.sqrt(yields.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / yields.length)
        : 0;
    const anomalyThreshold = mean - 1.5 * stddev;

    const sortedByYield = [...batches].sort((a: any, b: any) => (b.qualityYieldPercentage || 0) - (a.qualityYieldPercentage || 0));
    const topBatches = sortedByYield.slice(0, 3);
    const bottomBatches = sortedByYield.slice(-3).reverse().filter(() => totalBatches > 3);

    // Monthly cost data for MA chart
    const costMonthly = cost?.monthlyTrend?.map((d: any) => ({
        date: `${d._id.month}/${d._id.year}`,
        cost: d.totalCost
    })) ?? [];

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            {/* â”€â”€ Header / Filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold font-heading text-primary border-b border-subtle pb-2">
                    Yield &amp; Operational Efficiency
                </h2>
                <div className="flex bg-elevated rounded-lg shadow-md border border-subtle p-2 gap-2 items-center">
                    <Calendar className="h-5 w-5 text-brand-primary ml-2" />
                    <input type="date" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} className="border-none bg-transparent text-sm font-bold tracking-wide focus:ring-0 outline-none text-primary" />
                    <span className="text-muted font-bold">to</span>
                    <input type="date" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} className="border-none bg-transparent text-sm font-bold tracking-wide focus:ring-0 outline-none text-primary pr-2" />
                </div>
            </div>

            {totalBatches === 0 ? (
                <div className="p-12 text-center bg-canvas rounded-xl shadow-sm border border-subtle border-dashed">
                    <p className="text-secondary text-lg font-mono">No completed batches found for the selected date range.</p>
                </div>
            ) : (<>
                {/* â”€â”€ KPI Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {productionDashboard?.metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card p-4 rounded-xl border border-subtle">
                            <div className="text-xs uppercase tracking-wider text-secondary">30D Avg Yield</div>
                            <div className="text-2xl font-bold text-primary mt-1">{productionDashboard.metrics.averageYield}%</div>
                        </div>
                        <div className="bg-card p-4 rounded-xl border border-subtle">
                            <div className="text-xs uppercase tracking-wider text-secondary">30D Rejection</div>
                            <div className="text-2xl font-bold text-primary mt-1">{productionDashboard.metrics.overallRejectionPercent}%</div>
                        </div>
                        <div className="bg-card p-4 rounded-xl border border-subtle">
                            <div className="text-xs uppercase tracking-wider text-secondary">Completed Batches (30D)</div>
                            <div className="text-2xl font-bold text-primary mt-1">{productionDashboard.metrics.totalBatchesRunning}</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-card p-5 rounded-xl shadow-md border border-subtle">
                        <div className="text-xs uppercase tracking-wider font-bold text-secondary mb-1">Total Processed</div>
                        <div className="text-2xl font-bold text-primary font-mono tabular-nums">{totalInput.toFixed(0)} <span className="text-xs text-secondary font-normal">kg</span></div>
                        <div className="text-[10px] uppercase font-bold text-brand-primary mt-2 tracking-wider">{totalBatches} completed batches</div>
                    </div>
                    <div className="bg-elevated p-5 rounded-xl border border-status-success/30 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-status-success/10 rounded-full blur-2xl -mr-6 -mt-6" />
                        <div className="text-xs font-bold text-status-success mb-1 flex items-center gap-1.5 uppercase tracking-wider relative z-10"><Percent className="h-4 w-4" /> Avg Quality Yield</div>
                        <div className="text-3xl font-black text-status-success tabular-nums font-mono relative z-10">{avgYield}%</div>
                        <div className="text-[10px] text-primary/80 uppercase tracking-widest mt-2 font-bold relative z-10">Target: 90.0%</div>
                    </div>
                    <div className="bg-elevated p-5 rounded-xl border border-status-danger/30 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-status-danger/10 rounded-full blur-2xl -mr-6 -mt-6" />
                        <div className="text-xs font-bold text-status-danger mb-1 flex items-center gap-1.5 uppercase tracking-wider relative z-10"><ArrowDownRight className="h-4 w-4" /> Avg Wastage</div>
                        <div className="text-3xl font-black text-status-danger tabular-nums font-mono relative z-10">{avgWastage}%</div>
                        <div className="text-[10px] text-status-danger mt-2 font-bold uppercase tracking-wider relative z-10">{(totalInput - totalQualityOutput - totalRejection).toFixed(0)} kg lost completely</div>
                    </div>
                    <div className="bg-card p-5 rounded-xl shadow-md border border-subtle">
                        <div className="text-xs uppercase tracking-wider font-bold text-secondary mb-1">Recoverable Rejection</div>
                        <div className="text-2xl font-bold text-primary font-mono tabular-nums">{totalRejection.toFixed(0)} <span className="text-xs text-secondary font-normal">kg</span></div>
                        <div className="text-[10px] text-status-warning uppercase font-bold tracking-wider mt-2">{(totalInput > 0 ? (totalRejection / totalInput) * 100 : 0).toFixed(1)}% of total input</div>
                    </div>
                    <div className="bg-card p-5 rounded-xl shadow-md border border-subtle">
                        <div className="text-xs uppercase tracking-wider font-bold text-secondary mb-1 flex items-center gap-1.5"><Flame className="h-4 w-4 text-brand-primary" /> Util Cost</div>
                        <div className="text-2xl font-bold text-status-info font-mono tracking-tight">â‚¹{totalUtilityCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        <div className="text-[10px] uppercase font-bold text-muted tracking-wider mt-2">Std. rates</div>
                    </div>
                </div>

                {/* â”€â”€ Yield Decomposition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="bg-card rounded-xl shadow-lg border border-subtle p-6">
                    <h3 className="text-base font-bold text-primary font-heading uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-brand-primary" /> Output Composition (% of Input)
                    </h3>
                    <YieldBreakdownBar batches={batches} />
                    <p className="text-[10px] text-muted font-mono mt-2">Each band shows what percentage of total input ended up as first-grade, second-grade, rejection, or unaccounted loss.</p>
                </div>

                {/* â”€â”€ OEE Gauges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {oeeData.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold font-heading text-primary border-b border-subtle pb-2 flex items-center gap-2">
                            <Cpu className="h-6 w-6 text-brand-primary" /> Machine OEE Metrics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {oeeData.map((m: any) => (
                                <div key={m._id} className="bg-card rounded-xl border border-subtle shadow-md p-5 flex flex-col items-center">
                                    <div className="text-sm font-bold text-primary font-heading mb-1">{m.machineName}</div>
                                    <div className="text-[10px] text-muted font-mono uppercase tracking-wider mb-3">{m.machineCode} Â· {m.totalCompleted}/{m.totalScheduled} batches</div>
                                    <GaugeChart value={m.oee} label="OEE" color={m.oee >= 65 ? '#22c55e' : m.oee >= 40 ? '#f97316' : '#ef4444'} />
                                    <div className="mt-3 grid grid-cols-2 gap-2 w-full text-center">
                                        <div className="bg-elevated rounded-lg p-2">
                                            <div className="text-[10px] text-muted uppercase tracking-wider">Availability</div>
                                            <div className="text-sm font-black font-mono text-status-info">{m.availability}%</div>
                                        </div>
                                        <div className="bg-elevated rounded-lg p-2">
                                            <div className="text-[10px] text-muted uppercase tracking-wider">Quality Rate</div>
                                            <div className="text-sm font-black font-mono text-status-success">{m.qualityRate}%</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* â”€â”€ Shift Comparison â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {shiftData.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold font-heading text-primary border-b border-subtle pb-2 flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-brand-primary" /> Shift Performance Comparison
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-card rounded-xl shadow-lg border border-subtle p-6">
                                <h4 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4">Yield Â· Rejection Â· Wastage by Shift</h4>
                                <ShiftComparisonChart data={shiftData} />
                            </div>
                            <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden">
                                <div className="px-6 py-4 border-b border-subtle bg-canvas/50">
                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wide">Shift Summary</h4>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-elevated border-b border-subtle">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Shift</th>
                                            <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Batches</th>
                                            <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">Avg Yield</th>
                                            <th className="px-5 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">1st Pass</th>
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

                {/* â”€â”€ Batch Performance Tables + Cost Trend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden flex flex-col h-72">
                        <div className="px-6 py-4 border-b border-subtle bg-status-success/5">
                            <h3 className="font-bold text-status-success flex items-center gap-2 font-heading uppercase tracking-wider text-sm">
                                <ArrowUpRight className="h-5 w-5" /> Top Yielding Batches
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm divide-y divide-subtle text-left">
                                <thead className="bg-elevated sticky top-0 border-b border-subtle">
                                    <tr>
                                        <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Batch</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Input</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-bold text-secondary uppercase tracking-wider">Yield</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle">
                                    {topBatches.map((batch: any) => (
                                        <tr key={batch._id} className="hover:bg-canvas/50">
                                            <td className="px-6 py-3.5">
                                                <div className="font-mono text-sm font-bold text-primary">{batch.batchNumber}</div>
                                                <div className="text-xs text-secondary uppercase font-semibold mt-1 tracking-wider">{batch.fabricType}</div>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-secondary font-mono">{batch.inputKg} kg</td>
                                            <td className="px-6 py-3.5 text-right font-bold text-status-success font-mono">{batch.qualityYieldPercentage}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cost Trend with MA overlay */}
                    {costMonthly.length > 0 && (
                        <div className="bg-card rounded-xl shadow-lg border border-subtle p-6 h-72">
                            <h3 className="text-base font-bold text-primary mb-3 font-heading flex items-center gap-2 uppercase tracking-wide">
                                <DollarSign className="h-5 w-5 text-brand-primary" /> Material Cost Trend
                            </h3>
                            <div className="h-52">
                                <ComposedBarMAChart data={costMonthly} xKey="date" barKey="cost" barName="Monthly Cost (â‚¹)" barColor="#d4a853" maPeriod={3} />
                            </div>
                        </div>
                    )}
                </div>

                {/* â”€â”€ Anomaly Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {bottomBatches.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xl font-bold font-heading text-primary border-b border-subtle pb-2 flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-status-danger" /> Low-Yield Anomalies
                            <span className="text-xs text-muted font-mono font-normal ml-2">Batches below {anomalyThreshold.toFixed(1)}% (mean âˆ’ 1.5Ïƒ)</span>
                        </h3>
                        <div className="bg-card rounded-xl border border-status-danger/30 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-elevated border-b border-subtle">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary uppercase tracking-wider">Batch</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary uppercase tracking-wider">Shift</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary uppercase tracking-wider">Wastage Reason</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-bold text-secondary uppercase tracking-wider">Yield</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-bold text-secondary uppercase tracking-wider">Deviation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle">
                                    {bottomBatches.map((b: any) => {
                                        const yld = b.qualityYieldPercentage ?? 0;
                                        const dev = (yld - mean).toFixed(1);
                                        const isAnomaly = yld < anomalyThreshold;
                                        return (
                                            <tr key={b._id} className={isAnomaly ? 'bg-status-danger/5' : 'hover:bg-canvas/50'}>
                                                <td className="px-6 py-3.5 font-mono font-bold text-primary">{b.batchNumber}</td>
                                                <td className="px-6 py-3.5 text-secondary font-semibold">{b.shift}</td>
                                                <td className="px-6 py-3.5 text-secondary text-xs">{b.wastage?.reason ?? 'â€”'}</td>
                                                <td className="px-6 py-3.5 text-right font-black font-mono text-status-danger">{yld}%</td>
                                                <td className="px-6 py-3.5 text-right font-mono text-status-danger text-xs">{dev}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* â”€â”€ Efficiency / Re-issue Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {efficiency?.inefficientBatches?.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-subtle">
                        <h3 className="text-xl font-bold font-heading text-primary border-b border-subtle pb-2">Material Re-issue Analysis</h3>
                        <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden">
                            <div className="px-6 py-4 border-b border-status-danger/30 bg-status-danger/5">
                                <h3 className="font-bold tracking-wider uppercase text-status-danger flex items-center gap-2 text-sm">
                                    <Layers className="h-5 w-5" /> Multiple Issue Requests Detected (&gt;3 per material)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-elevated border-b border-subtle">
                                        <tr>
                                            <th className="px-6 py-3.5 font-bold text-secondary uppercase tracking-wider text-xs">Batch Ref</th>
                                            <th className="px-6 py-3.5 font-bold text-secondary uppercase tracking-wider text-xs">Material</th>
                                            <th className="px-6 py-3.5 text-center font-bold text-secondary uppercase tracking-wider text-xs">Issue Count</th>
                                            <th className="px-6 py-3.5 text-right font-bold text-secondary uppercase tracking-wider text-xs">Total Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-subtle">
                                        {efficiency.inefficientBatches.map((b: any, i: number) => (
                                            <tr key={i} className="hover:bg-canvas/50">
                                                <td className="px-6 py-4 font-mono font-bold text-primary">{b.batchId}</td>
                                                <td className="px-6 py-4 font-bold text-primary font-heading">{b.materialName}</td>
                                                <td className="px-6 py-4 text-center"><span className="inline-flex items-center justify-center px-2.5 py-1 rounded-[4px] bg-status-danger/10 border border-status-danger/30 text-status-danger font-bold text-xs">{b.issueCount}Ã—</span></td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-secondary">{b.totalQty.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </>)}
        </div>
    );
};

export default AnalyticsProduction;
