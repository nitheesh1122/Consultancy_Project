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
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;
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
                    <h2 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2 border-b pb-2">
                        Yield & Operational Efficiency
                    </h2>
                </div>

                <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-2 gap-2 items-center">
                    <Calendar className="h-5 w-5 text-slate-400 ml-2" />
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="border-none bg-transparent text-sm font-medium focus:ring-0 outline-none text-slate-700"
                    />
                    <span className="text-slate-300">to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="border-none bg-transparent text-sm font-medium focus:ring-0 outline-none text-slate-700 pr-2"
                    />
                </div>
            </div>

            {totalBatches === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-lg">No completed batches found for the selected date range.</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-sm font-medium text-slate-500 mb-1">Total Processed</div>
                            <div className="text-2xl font-bold text-slate-900">{totalInput.toFixed(0)} <span className="text-sm text-slate-500 font-normal">kg</span></div>
                            <div className="text-xs text-slate-400 mt-2">{totalBatches} completed batches</div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200 shadow-sm">
                            <div className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-1 uppercase tracking-wider"><Percent className="h-4 w-4" /> Avg Quality Yield</div>
                            <div className="text-3xl font-black text-emerald-700">{avgYield}%</div>
                            <div className="text-xs text-emerald-600 mt-2 font-medium">Target: 90.0%</div>
                        </div>

                        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-5 rounded-xl border border-rose-200 shadow-sm">
                            <div className="text-sm font-bold text-rose-800 mb-1 flex items-center gap-1 uppercase tracking-wider"><ArrowDownRight className="h-4 w-4" /> Avg Wastage</div>
                            <div className="text-3xl font-black text-rose-700">{avgWastage}%</div>
                            <div className="text-xs text-rose-600 mt-2 font-medium">{((totalInput - (totalQualityOutput + totalRejection)) || 0).toFixed(0)} kg lost completely</div>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-sm font-medium text-indigo-800 mb-1">Recoverable Rejection</div>
                            <div className="text-2xl font-bold text-indigo-900">{totalRejection.toFixed(0)} <span className="text-sm font-normal">kg</span></div>
                            <div className="text-xs text-indigo-500 mt-2">{(totalInput > 0 ? (totalRejection / totalInput) * 100 : 0).toFixed(1)}% of total input</div>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-sm font-medium text-orange-800 mb-1 flex items-center gap-1"><Flame className="h-4 w-4" /> Estimated Util Cost</div>
                            <div className="text-2xl font-bold text-slate-900">₹{totalUtilityCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                            <div className="text-xs text-slate-500 mt-2">Based on standard rates</div>
                        </div>
                    </div>

                    {/* Batch Performance Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-64 flex flex-col">
                            <div className="px-5 py-4 border-b border-slate-100 bg-emerald-50/50">
                                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                    <ArrowUpRight className="h-5 w-5 text-emerald-600" /> Top Yielding Batches
                                </h3>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-sm divide-y divide-slate-100">
                                    <thead className="bg-white sticky top-0">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Batch</th>
                                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase">Input</th>
                                            <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase">Yield</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {topBatches.map((batch: any) => (
                                            <tr key={batch._id}>
                                                <td className="px-5 py-3 whitespace-nowrap">
                                                    <div className="font-mono text-sm font-medium text-slate-900">{batch.batchNumber}</div>
                                                    <div className="text-xs text-slate-500">{batch.fabricType}</div>
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">{batch.inputKg} kg</td>
                                                <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-emerald-600">
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
                            <div className="industrial-card p-6 h-64 bg-white rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-base font-bold text-slate-800 mb-4 font-heading flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-indigo-600" /> Material Cost Trends
                                </h3>
                                <div className="h-40">
                                    <SimpleLineChart
                                        data={cost.monthlyTrend.map((d: any) => ({
                                            date: `${d._id.month}/${d._id.year}`,
                                            cost: d.totalCost
                                        }))}
                                        xKey="date"
                                        lines={[{ key: 'cost', name: 'Cost (₹)', color: '#4f46e5' }]}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Efficiency Analysis */}
                    {efficiency?.inefficientBatches && efficiency.inefficientBatches.length > 0 && (
                        <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
                            <h3 className="text-lg font-bold font-heading text-slate-900 border-b pb-2">Material Re-issue Analysis (Inefficiency)</h3>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-5 py-4 border-b border-rose-100 bg-rose-50/50">
                                    <h3 className="font-bold text-rose-800 flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-rose-600" /> Multiple Issue Requests Detected (&gt;3 per material)
                                    </h3>
                                    <p className="text-xs text-rose-600 mt-1">Frequent small re-issues of the same chemical for a batch indicate poor matching or lab dip failures.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase text-xs">Batch Reference</th>
                                                <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase text-xs">Material Name</th>
                                                <th className="px-6 py-3 text-center font-bold text-slate-500 uppercase text-xs">Issue Count</th>
                                                <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase text-xs">Total Qty Used</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {efficiency.inefficientBatches.map((b: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 text-slate-900 font-mono font-medium">{b.batchId}</td>
                                                    <td className="px-6 py-3 text-slate-700 font-medium">{b.materialName}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold">
                                                            {b.issueCount} times
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-600 font-mono">{b.totalQty.toFixed(2)}</td>
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
