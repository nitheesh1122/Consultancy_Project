import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Activity, Percent, Flame, DollarSign, Layers, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { SimpleBarChart, SimpleLineChart } from '../../components/Charts';

const AnalyticsProduction = () => {
    // Basic date state (last 7 days by default)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const { data: batches = [], isLoading: isBatchesLoading } = useQuery({
        queryKey: ['production-analytics', dateRange],
        queryFn: async () => {
            const res = await api.get('/production-batches', {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    status: 'COMPLETED'
                }
            });
            return res.data;
        }
    });

    const { data: efficiency, isLoading: isEfficiencyLoading } = useQuery({
        queryKey: ['efficiency-stats'],
        queryFn: async () => {
            const res = await api.get('/analytics/efficiency');
            return res.data;
        }
    });

    const { data: cost, isLoading: isCostLoading } = useQuery({
        queryKey: ['cost-analytics'],
        queryFn: async () => {
            const res = await api.get('/analytics/cost');
            return res.data;
        }
    });

    if (isBatchesLoading || isEfficiencyLoading || isCostLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    // Compute Metrics
    const totalBatches = batches.length;
    const totalInput = batches.reduce((sum: number, b: any) => sum + (b.inputKg || 0), 0);
    const totalQualityOutput = batches.reduce((sum: number, b: any) => sum + (b.outputFirstGradeKg || 0) + (b.outputSecondGradeKg || 0), 0);
    const totalRejection = batches.reduce((sum: number, b: any) => sum + (b.rejectionKg || 0), 0);
    const totalUtilityCost = batches.reduce((sum: number, b: any) => sum + (b.utilities?.calculatedCost || 0), 0);

    const avgYield = totalInput > 0 ? ((totalQualityOutput / totalInput) * 100).toFixed(2) : '0.00';
    const avgWastage = totalInput > 0 ? (((totalInput - (totalQualityOutput + totalRejection)) / totalInput) * 100).toFixed(2) : '0.00';

    // Best and Worst performing batches
    const sortedByYield = [...batches].sort((a: any, b: any) => (b.qualityYieldPercentage || 0) - (a.qualityYieldPercentage || 0));
    const topBatches = sortedByYield.slice(0, 3);
    const bottomBatches = sortedByYield.slice(-3).reverse().filter(b => totalBatches > 3);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header / Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2 border-b border-subtle pb-2">
                        Yield & Operational Efficiency
                    </h2>
                </div>

                <div className="flex bg-elevated rounded-lg shadow-md border border-subtle p-2 gap-2 items-center">
                    <Calendar className="h-5 w-5 text-brand-primary ml-2" />
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="border-none bg-transparent text-sm font-bold tracking-wide focus:ring-0 outline-none text-primary"
                    />
                    <span className="text-muted font-bold">to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="border-none bg-transparent text-sm font-bold tracking-wide focus:ring-0 outline-none text-primary pr-2"
                    />
                </div>
            </div>

            {totalBatches === 0 ? (
                <div className="p-12 text-center bg-canvas rounded-xl shadow-sm border border-subtle border-dashed">
                    <p className="text-secondary text-lg font-mono">No completed batches found for the selected date range.</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-card p-5 rounded-xl shadow-md border border-subtle">
                            <div className="text-xs uppercase tracking-wider font-bold text-secondary mb-1">Total Processed</div>
                            <div className="text-2xl font-bold text-primary font-mono tabular-nums">{totalInput.toFixed(0)} <span className="text-xs text-secondary font-normal ml-0.5">kg</span></div>
                            <div className="text-[10px] uppercase font-bold text-brand-primary mt-2 tracking-wider">{totalBatches} completed batches</div>
                        </div>

                        <div className="bg-elevated p-5 rounded-xl border border-status-success/30 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-status-success/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
                            <div className="text-xs font-bold text-status-success mb-1 flex items-center gap-1.5 uppercase tracking-wider relative z-10"><Percent className="h-4 w-4" /> Avg Quality Yield</div>
                            <div className="text-3xl font-black text-status-success tabular-nums font-mono relative z-10">{avgYield}%</div>
                            <div className="text-[10px] text-primary/80 uppercase tracking-widest mt-2 font-bold relative z-10">Target: 90.0%</div>
                        </div>

                        <div className="bg-elevated p-5 rounded-xl border border-status-danger/30 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-status-danger/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
                            <div className="text-xs font-bold text-status-danger mb-1 flex items-center gap-1.5 uppercase tracking-wider relative z-10"><ArrowDownRight className="h-4 w-4" /> Avg Wastage</div>
                            <div className="text-3xl font-black text-status-danger tabular-nums font-mono relative z-10">{avgWastage}%</div>
                            <div className="text-[10px] text-status-danger mt-2 font-bold uppercase tracking-wider relative z-10">{((totalInput - (totalQualityOutput + totalRejection)) || 0).toFixed(0)} kg lost completely</div>
                        </div>

                        <div className="bg-card p-5 rounded-xl shadow-md border border-subtle">
                            <div className="text-xs uppercase tracking-wider font-bold text-secondary mb-1">Recoverable Rejection</div>
                            <div className="text-2xl font-bold text-primary font-mono tabular-nums">{totalRejection.toFixed(0)} <span className="text-xs text-secondary font-normal ml-0.5">kg</span></div>
                            <div className="text-[10px] text-status-warning uppercase font-bold tracking-wider mt-2">{(totalInput > 0 ? (totalRejection / totalInput) * 100 : 0).toFixed(1)}% of total input</div>
                        </div>

                        <div className="bg-card p-5 rounded-xl shadow-md border border-subtle">
                            <div className="text-xs uppercase tracking-wider font-bold text-secondary mb-1 flex items-center gap-1.5"><Flame className="h-4 w-4 text-brand-primary" /> Estimated Util Cost</div>
                            <div className="text-2xl font-bold text-primary font-mono tracking-tight text-status-info">₹{totalUtilityCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                            <div className="text-[10px] uppercase font-bold text-muted tracking-wider mt-2">Based on standard rates</div>
                        </div>
                    </div>

                    {/* Batch Performance Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden h-64 flex flex-col">
                            <div className="px-6 py-4 border-b border-subtle bg-status-success/5 backdrop-blur-sm">
                                <h3 className="font-bold text-status-success flex items-center gap-2 font-heading uppercase tracking-wider text-sm">
                                    <ArrowUpRight className="h-5 w-5 text-status-success" /> Top Yielding Batches
                                </h3>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-sm divide-y divide-subtle text-left border-collapse">
                                    <thead className="bg-elevated sticky top-0 border-b border-subtle">
                                        <tr>
                                            <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Batch</th>
                                            <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Input</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-secondary uppercase tracking-wider">Yield</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-subtle">
                                        {topBatches.map((batch: any) => (
                                            <tr key={batch._id} className="hover:bg-canvas/50 transition-colors">
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <div className="font-mono text-sm font-bold text-primary">{batch.batchNumber}</div>
                                                    <div className="text-xs text-secondary uppercase font-semibold mt-1 tracking-wider">{batch.fabricType}</div>
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-secondary font-mono">{batch.inputKg} <span className="text-[10px]">kg</span></td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-status-success font-mono">
                                                    {batch.qualityYieldPercentage}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Cost Trends */}
                        {cost?.monthlyTrend && (
                            <div className="industrial-card p-6 h-64 bg-card rounded-xl shadow-lg border border-subtle">
                                <h3 className="text-base font-bold text-primary mb-4 font-heading flex items-center gap-2 uppercase tracking-wide">
                                    <DollarSign className="h-5 w-5 text-brand-primary" /> Material Cost Trends
                                </h3>
                                <div className="h-40">
                                    <SimpleLineChart
                                        data={cost.monthlyTrend.map((d: any) => ({
                                            date: `${d._id.month}/${d._id.year}`,
                                            cost: d.totalCost
                                        }))}
                                        xKey="date"
                                        lines={[{ key: 'cost', name: 'Cost (₹)', color: '#d4a853' }]}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Efficiency Analysis */}
                    {efficiency?.inefficientBatches && efficiency.inefficientBatches.length > 0 && (
                        <div className="space-y-4 pt-6 mt-6 border-t border-subtle">
                            <h3 className="text-xl font-bold font-heading text-primary border-b border-subtle pb-2">Material Re-issue Analysis (Inefficiency)</h3>
                            <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden">
                                <div className="px-6 py-4 border-b border-status-danger/30 bg-status-danger/5 backdrop-blur-sm">
                                    <h3 className="font-bold tracking-wider uppercase text-status-danger flex items-center gap-2 text-sm">
                                        <Layers className="h-5 w-5 text-status-danger" /> Multiple Issue Requests Detected (&gt;3 per material)
                                    </h3>
                                    <p className="text-xs text-status-danger/80 mt-1.5 font-bold font-mono tracking-tight">Frequent small re-issues of the same chemical for a batch indicate poor matching or lab dip failures.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-elevated border-b border-subtle">
                                            <tr>
                                                <th className="px-6 py-3.5 font-bold text-secondary uppercase tracking-wider text-xs">Batch Reference</th>
                                                <th className="px-6 py-3.5 font-bold text-secondary uppercase tracking-wider text-xs">Material Name</th>
                                                <th className="px-6 py-3.5 text-center font-bold text-secondary uppercase tracking-wider text-xs">Issue Count</th>
                                                <th className="px-6 py-3.5 text-right font-bold text-secondary uppercase tracking-wider text-xs">Total Qty Used</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-subtle">
                                            {efficiency.inefficientBatches.map((b: any, i: number) => (
                                                <tr key={i} className="hover:bg-canvas/50 transition-colors">
                                                    <td className="px-6 py-4 text-primary font-mono font-bold">{b.batchId}</td>
                                                    <td className="px-6 py-4 text-primary font-bold font-heading">{b.materialName}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-[4px] bg-status-danger/10 border border-status-danger/30 text-status-danger font-bold shadow-sm text-xs tracking-wider uppercase">
                                                            {b.issueCount} times
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-secondary font-mono tracking-tight font-bold">{b.totalQty.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AnalyticsProduction;
