import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShieldAlert, BadgeCheck, Loader2, Layers, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import api from '../../lib/api';
import MetricCard from '../../components/ui/MetricCard';
import DecisionExplanation from '../../components/ui/DecisionExplanation';
import { SimpleBarChart } from '../../components/Charts';
import { Button } from '../../components/ui/Button';
import { generatePDF } from '../../lib/pdfGenerator';

const AnalyticsInventory = () => {
    const { data: health, isLoading: isLoadingHealth } = useQuery({
        queryKey: ['inventory-health'],
        queryFn: async () => {
            const res = await api.get('/analytics/inventory-health');
            return res.data;
        }
    });

    const { data: forecast, isLoading: isLoadingForecast } = useQuery({
        queryKey: ['forecast'],
        queryFn: async () => {
            const res = await api.get('/analytics/forecast');
            return res.data;
        }
    });

    if (isLoadingHealth || isLoadingForecast) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;
    }

    const { allMaterials = [], lowStock = [], deadStock = [] } = health || {};

    const exportForecast = () => {
        if (!Array.isArray(forecast)) return;

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
            tableData: forecast,
            metaData: {
                "Total Items": forecast.length.toString(),
                "Critical Items": forecast.filter((s: any) => s.status === 'REORDER_NOW').length.toString()
            },
            summary: "This report provides a forecast of material requirements based on recent consumption trends. Items marked 'Order Needed' have coverage below the safety threshold."
        });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Inventory Health Section */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-bold font-heading text-slate-900 border-b pb-2">Inventory Health & Distribution</h3>
                </div>

                {lowStock.length > 0 && (
                    <DecisionExplanation
                        status="critical"
                        title="Inventory Risk Assessment"
                        reasons={[`${lowStock.length} items are critically low.`, "Potential production halt detected."]}
                        action="Prioritize reordering for items with < 15 days coverage."
                        impact="Line stoppage risk is HIGH."
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Low Stock Items"
                        value={lowStock.length}
                        icon={AlertTriangle}
                        status={lowStock.length > 0 ? "critical" : "good"}
                    />
                    <MetricCard
                        title="Dead Stock"
                        value={deadStock.length}
                        icon={Layers}
                        status={deadStock.length > 0 ? "warning" : "default"}
                    />
                    <MetricCard
                        title="Total SKU Count"
                        value={allMaterials.length}
                        icon={Package}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="industrial-card p-6 h-96 bg-white rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 font-heading">Stock Distribution</h3>
                        <SimpleBarChart
                            data={[
                                { name: 'Healthy', value: allMaterials.length - lowStock.length - deadStock.length },
                                { name: 'Low', value: lowStock.length },
                                { name: 'Dead', value: deadStock.length }
                            ]}
                            xKey="name"
                            yKey="value"
                            color="#4f46e5"
                            name="Items"
                        />
                    </div>

                    <div className="industrial-card p-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-96">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 font-heading">Critical Low Stock List</h3>
                        </div>
                        <div className="overflow-auto flex-1 p-2">
                            <table className="w-full text-sm">
                                <thead className="text-slate-500 uppercase text-xs sticky top-0 bg-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">Material</th>
                                        <th className="px-4 py-3 text-right font-semibold">Coverage</th>
                                        <th className="px-4 py-3 text-center font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lowStock.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">No critical items.</td></tr>
                                    ) : lowStock.map((m: any) => (
                                        <tr key={m.materialId} className="hover:bg-rose-50/10">
                                            <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                                            <td className="px-4 py-3 text-right font-bold text-rose-600">{m.daysRemaining} days</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
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

                {/* Dead stock list */}
                {deadStock.length > 0 && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-200">
                        <div className="flex items-center gap-2 text-orange-800 font-bold mb-4">
                            <Layers className="h-5 w-5" /> Dead Stock List (Zero consumption in 30 days)
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {deadStock.map((item: any) => (
                                <li key={item.materialId} className="flex justify-between items-center text-sm border border-orange-100 bg-orange-50/30 p-3 rounded-lg">
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    <span className="text-xs text-gray-500 font-bold">Qty: {item.currentStock}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Forecast Section */}
            {Array.isArray(forecast) && (
                <div className="space-y-6 pt-6 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                                <TrendingUp className="h-6 w-6 text-indigo-600" /> Reorder Forecast
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">AI-driven suggestions based on continuous consumption rates.</p>
                            <p className="text-xs text-slate-400 mt-1 italic">
                                * Forecast based on last 30 days average consumption. Includes 15-day safety buffer + 7 days lead.
                            </p>
                        </div>
                        <Button onClick={exportForecast} variant="primary" className="gap-2">
                            <Download className="w-4 h-4" /> Export PDF Report
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm divide-y divide-slate-200">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Material</th>
                                        <th className="px-6 py-4 text-right">Current Stock</th>
                                        <th className="px-6 py-4 text-right">Avg Daily Use</th>
                                        <th className="px-6 py-4 text-right">7-Day Forecast</th>
                                        <th className="px-6 py-4 text-right">Suggested Reorder</th>
                                        <th className="px-6 py-4 text-center">Status Requirement</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {forecast.map((item: any) => (
                                        <tr key={item.materialId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-mono">{item.currentStock}</td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-mono">{item.avgDaily}</td>
                                            <td className="px-6 py-4 text-right text-slate-500 font-mono">{item.forecast7Days}</td>
                                            <td className="px-6 py-4 text-right font-bold text-indigo-700 font-mono text-base">{item.suggestedReorder}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'REORDER_NOW'
                                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
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
                </div>
            )}
        </div>
    );
};

export default AnalyticsInventory;
