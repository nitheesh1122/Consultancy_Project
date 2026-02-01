import { useState, useEffect } from 'react';
import api from '../lib/api';
import KPICard from '../components/KPICard';
import { SimpleBarChart, SimpleLineChart } from '../components/Charts';
import {
    LayoutDashboard, Package, Clock, Activity, DollarSign, TrendingUp, AlertTriangle, Layers, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        const doc = new jsPDF();
        doc.text("Reorder Forecast Recommendation", 14, 15);

        const tableData = Array.isArray(stats) ? stats.map((item: any) => [
            item.name, item.currentStock, item.avgDaily, item.suggestedReorder, item.status
        ]) : [];

        autoTable(doc, {
            head: [['Material', 'Current Stock', 'Avg Daily', 'Suggested Reorder', 'Status']],
            body: tableData,
            startY: 20
        });

        doc.save("forecast_report.pdf");
    };

    const tabs = [
        { id: 'INVENTORY', label: 'Inventory Health', icon: Package },
        { id: 'PROCUREMENT', label: 'Procurement', icon: Clock },
        { id: 'EFFICIENCY', label: 'Efficiency', icon: Activity },
        { id: 'COST', label: 'Cost Analysis', icon: DollarSign },
        { id: 'FORECAST', label: 'Forecast & Reorder', icon: TrendingUp },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <LayoutDashboard className="mr-2 text-indigo-600" /> Analytics Dashboard
                </h2>
                <div className="flex space-x-2 mt-4 sm:mt-0 overflow-x-auto pb-2 sm:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items - center px - 4 py - 2 rounded - lg text - sm font - medium transition - colors whitespace - nowrap ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                } `}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
            ) : (
                <>
                    {/* INVENTORY HEALTH */}
                    {activeTab === 'INVENTORY' && stats.allMaterials && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <KPICard title="Low Stock Items" value={stats.lowStock.length} icon={AlertTriangle} color="text-red-600" />
                                <KPICard title="Dead Stock Items" value={stats.deadStock.length} icon={Layers} color="text-amber-600" />
                                <KPICard title="Total Materials" value={stats.allMaterials.length} icon={Package} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800">Risk Assessment</h3>
                                    <div className="flex items-center justify-center h-64">
                                        {/* Simple visualization of stock status */}
                                        <SimpleBarChart
                                            data={[
                                                { name: 'Good', value: stats.allMaterials.length - stats.lowStock.length - stats.deadStock.length },
                                                { name: 'Low Stock', value: stats.lowStock.length },
                                                { name: 'Dead Stock', value: stats.deadStock.length }
                                            ]}
                                            xKey="name"
                                            yKey="value"
                                            color="#4F46E5"
                                            name="Count"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800">Critical Stock List</h3>
                                    <div className="overflow-auto max-h-64">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-left">
                                                    <th className="p-3 font-medium">Material</th>
                                                    <th className="p-3 font-medium">Days Left</th>
                                                    <th className="p-3 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.lowStock.map((m: any) => (
                                                    <tr key={m.materialId} className="border-b">
                                                        <td className="p-3">{m.name}</td>
                                                        <td className="p-3 font-bold text-red-600">{m.daysRemaining} days</td>
                                                        <td className="p-3"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Low Stock</span></td>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <KPICard title="Avg Approval Time" value={`${stats.metrics.avgApprovalTime.toFixed(1)} Days`} icon={Clock} />
                                <KPICard title="Avg Completion Time" value={`${stats.metrics.avgCompletionTime.toFixed(1)} Days`} icon={Clock} />
                                <KPICard title="Delayed PIs" value={stats.delayedPIs?.length || 0} icon={AlertTriangle} color="text-red-500" />
                            </div>
                        </div>
                    )}

                    {/* EFFICIENCY */}
                    {activeTab === 'EFFICIENCY' && stats.supervisorPerformance && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-4">Supervisor Efficiency</h3>
                                    <SimpleBarChart data={stats.supervisorPerformance} xKey="name" yKey="efficiency" name="Efficiency %" />
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-4">Batch Re-issue Inefficiencies</h3>
                                    <div className="overflow-auto max-h-80">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-left">
                                                    <th className="p-3 font-medium">Batch</th>
                                                    <th className="p-3 font-medium">Material</th>
                                                    <th className="p-3 font-medium">Issues</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.inefficientBatches?.map((b: any, i: number) => (
                                                    <tr key={i} className="border-b">
                                                        <td className="p-3">{b.batchId}</td>
                                                        <td className="p-3">{b.materialName}</td>
                                                        <td className="p-3 font-bold text-red-500">{b.issueCount}</td>
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
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                                <h3 className="text-lg font-bold mb-4">Material Cost Trend</h3>
                                <SimpleLineChart
                                    data={stats.monthlyTrend.map((d: any) => ({
                                        date: `${d._id.month}/${d._id.year}`,
                                        cost: d.totalCost
                                    }))}
                                    xKey="date"
                                    lines={[{ key: 'cost', name: 'Cost (₹)', color: '#10B981' }]}
                                />
                            </div >
                        </div >
                    )}

                    {/* FORECAST */}
                    {
                        activeTab === 'FORECAST' && Array.isArray(stats) && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-800">Reorder Recommendations</h3>
                                    <button onClick={exportForecast} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                        <Download className="w-4 h-4" /> <span>Export PDF</span>
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="min-w-full text-sm divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Material</th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Current Stock</th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Avg Daily Use</th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">7-Day Forecast</th>
                                                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Suggested Reorder</th>
                                                <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {stats.map((item: any) => (
                                                <tr key={item.materialId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                    <td className="px-6 py-4 text-right">{item.currentStock}</td>
                                                    <td className="px-6 py-4 text-right">{item.avgDaily}</td>
                                                    <td className="px-6 py-4 text-right text-gray-600">{item.forecast7Days}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-indigo-600">{item.suggestedReorder}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'REORDER_NOW' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
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
                </>
            )}
        </div >
    );
};

export default Reports;
