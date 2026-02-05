import { useState, useEffect } from 'react';
import api from '../lib/api';
import MetricCard from '../components/ui/MetricCard';
import DecisionExplanation from '../components/ui/DecisionExplanation';
import { SimpleBarChart, SimpleLineChart } from '../components/Charts';
import { Button } from '../components/ui/Button';
import {
    LayoutDashboard, Package, Clock, Activity, DollarSign, TrendingUp, AlertTriangle, Layers, Download, CheckCircle, AlertCircle
} from 'lucide-react';
import { generatePDF } from '../lib/pdfGenerator';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('INVENTORY');
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (tab: string) => {
        setLoading(true);
        try {
            let endpoint = '/analytics/dashboard';
            if (tab === 'INVENTORY') endpoint = '/analytics/inventory-health';
            if (tab === 'PROCUREMENT') endpoint = '/analytics/procurement-performance';
            if (tab === 'EFFICIENCY') endpoint = '/analytics/efficiency';
            if (tab === 'COST') endpoint = '/analytics/cost';
            if (tab === 'FORECAST') endpoint = '/analytics/forecast';

            const res = await api.get(endpoint);
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats', error);
        } finally {
            setLoading(false);
        }
    };

    const exportForecast = () => {
        if (!Array.isArray(stats)) return;

        generatePDF({
            title: "REORDER FORECAST",
            reportType: "Forecast Analysis",
            generatedBy: "System (Admin)",
            fileName: "forecast_report.pdf",
            tableColumns: [
                { header: "Material", dataKey: "name" },
                { header: "Current Stock", dataKey: "currentStock" },
                { header: "Avg Daily", dataKey: "avgDaily" },
                { header: "Suggested Reorder", dataKey: "suggestedReorder" },
                { header: "Status", dataKey: "status" }
            ],
            tableData: stats,
            metaData: {
                "Total Items": stats.length.toString(),
                "Critical Items": stats.filter((s: any) => s.status === 'REORDER_NOW').length.toString()
            },
            summary: "This report provides a forecast of material requirements based on recent consumption trends. Items marked 'Order Needed' have coverage below the safety threshold."
        });
    };

    const tabs = [
        { id: 'INVENTORY', label: 'Inventory Health', icon: Package },
        { id: 'PROCUREMENT', label: 'Procurement', icon: Clock },
        { id: 'EFFICIENCY', label: 'Efficiency', icon: Activity },
        { id: 'COST', label: 'Cost Analysis', icon: DollarSign },
        { id: 'FORECAST', label: 'Forecast', icon: TrendingUp },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
                <div className="h-8 w-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading Analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6 text-slate-700" />
                        Analytics & Reports
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Deep dive into operational metrics and performance trends.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                } `}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="animate-slide-up">
                {/* INVENTORY HEALTH */}
                {activeTab === 'INVENTORY' && stats.allMaterials && (
                    <div className="space-y-6">
                        {/* Decision Block */}
                        {stats.lowStock.length > 0 && (
                            <DecisionExplanation
                                status="critical"
                                title="Inventory Risk Assessment"
                                reasons={[`${stats.lowStock.length} items are critically low.`, "Potential production halt detected."]}
                                action="Prioritize reordering for items with < 3 days coverage."
                                impact="Line stoppage risk is HIGH."
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard
                                title="Low Stock Items"
                                value={stats.lowStock.length}
                                icon={AlertTriangle}
                                status={stats.lowStock.length > 0 ? "critical" : "good"}
                            />
                            <MetricCard
                                title="Dead Stock"
                                value={stats.deadStock.length}
                                icon={Layers}
                                status={stats.deadStock.length > 0 ? "warning" : "default"}
                            />
                            <MetricCard
                                title="Total SKU Count"
                                value={stats.allMaterials.length}
                                icon={Package}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="industrial-card p-6 h-96">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 font-heading">Stock Distribution</h3>
                                <SimpleBarChart
                                    data={[
                                        { name: 'Healthy', value: stats.allMaterials.length - stats.lowStock.length - stats.deadStock.length },
                                        { name: 'Low', value: stats.lowStock.length },
                                        { name: 'Dead', value: stats.deadStock.length }
                                    ]}
                                    xKey="name"
                                    yKey="value"
                                    color="#475569"
                                    name="Items"
                                />
                            </div>

                            <div className="industrial-card p-0 overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 font-heading">Critical Low Stock List</h3>
                                </div>
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-semibold">Material</th>
                                                <th className="px-6 py-3 text-right font-semibold">Coverage</th>
                                                <th className="px-6 py-3 text-center font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {stats.lowStock.length === 0 ? (
                                                <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">No critical items.</td></tr>
                                            ) : stats.lowStock.map((m: any) => (
                                                <tr key={m.materialId} className="hover:bg-rose-50/10">
                                                    <td className="px-6 py-3 font-medium text-slate-900">{m.name}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-rose-600">{m.daysRemaining} days</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                                                            Critical
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PROCUREMENT PERFORMANCE */}
                {activeTab === 'PROCUREMENT' && stats.metrics && (
                    <div className="space-y-6">
                        <DecisionExplanation
                            status={stats.delayedPIs?.length > 0 ? "warning" : "good"}
                            title="Procurement Efficiency Status"
                            reasons={[
                                `Average approval time: ${stats.metrics.avgApprovalTime.toFixed(1)} days.`,
                                `${stats.delayedPIs?.length || 0} orders currently delayed.`
                            ]}
                            action="Follow up with suppliers for delayed PIs."
                            impact="Delays increase risk of material shortage."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard title="Avg Approval Time" value={`${stats.metrics.avgApprovalTime.toFixed(1)} Days`} icon={Clock} />
                            <MetricCard title="Avg Completion Time" value={`${stats.metrics.avgCompletionTime.toFixed(1)} Days`} icon={CheckCircle} />
                            <MetricCard title="Delayed Orders" value={stats.delayedPIs?.length || 0} icon={AlertCircle} status={stats.delayedPIs?.length > 0 ? "critical" : "default"} />
                        </div>
                    </div>
                )}

                {/* EFFICIENCY */}
                {activeTab === 'EFFICIENCY' && stats.supervisorPerformance && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="industrial-card p-6 h-96">
                                <h3 className="text-lg font-bold mb-4 font-heading">Supervisor Efficiency</h3>
                                <SimpleBarChart data={stats.supervisorPerformance} xKey="name" yKey="efficiency" name="Efficiency %" color="#059669" />
                            </div>
                            <div className="industrial-card p-6 h-96 overflow-hidden flex flex-col">
                                <h3 className="text-lg font-bold mb-4 font-heading">Re-issue Analysis (Inefficiency)</h3>
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Batch</th>
                                                <th className="px-4 py-2 text-left">Material</th>
                                                <th className="px-4 py-2 text-right">Issues</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {stats.inefficientBatches?.map((b: any, i: number) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-2 text-slate-700">{b.batchId}</td>
                                                    <td className="px-4 py-2 text-slate-500">{b.materialName}</td>
                                                    <td className="px-4 py-2 text-right font-bold text-rose-600">{b.issueCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* COST */}
                {activeTab === 'COST' && stats.monthlyTrend && (
                    <div className="space-y-6">
                        <div className="industrial-card p-6 h-96">
                            <h3 className="text-lg font-bold mb-6 font-heading">Monthly Material Cost Trend</h3>
                            <SimpleLineChart
                                data={stats.monthlyTrend.map((d: any) => ({
                                    date: `${d._id.month}/${d._id.year}`,
                                    cost: d.totalCost
                                }))}
                                xKey="date"
                                lines={[{ key: 'cost', name: 'Cost (₹)', color: '#0f172a' }]}
                            />
                        </div >
                    </div >
                )}

                {/* FORECAST */}
                {
                    activeTab === 'FORECAST' && Array.isArray(stats) && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold font-heading text-slate-900">Reorder Forecast</h3>
                                    <p className="text-sm text-slate-500">AI-driven suggestions based on consumption rates.</p>
                                    <p className="text-xs text-slate-400 mt-1 italic">
                                        * Forecast based on last 30 days average consumption. Includes 15-day safety buffer.
                                    </p>
                                </div>
                                <Button onClick={exportForecast} variant="primary" className="gap-2">
                                    <Download className="w-4 h-4" /> Export Report
                                </Button>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm divide-y divide-slate-100">
                                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Material</th>
                                            <th className="px-6 py-4 text-right">Current Stock</th>
                                            <th className="px-6 py-4 text-right">Avg Daily Use</th>
                                            <th className="px-6 py-4 text-right">7-Day Forecast</th>
                                            <th className="px-6 py-4 text-right">Suggested Reorder</th>
                                            <th className="px-6 py-4 text-center">Recommendation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {stats.map((item: any) => (
                                            <tr key={item.materialId} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{item.currentStock}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{item.avgDaily}</td>
                                                <td className="px-6 py-4 text-right text-slate-500">{item.forecast7Days}</td>
                                                <td className="px-6 py-4 text-right font-bold text-indigo-600">{item.suggestedReorder}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status === 'REORDER_NOW'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                        {item.status === 'REORDER_NOW' ? 'Order Needed' : 'Sufficient'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
            </div>
        </div >
    );
};

export default Reports;
