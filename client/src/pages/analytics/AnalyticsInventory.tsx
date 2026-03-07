import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShieldAlert, BadgeCheck, Loader2, Layers, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import api from '../../lib/api';
import MetricCard from '../../components/ui/MetricCard';
import DecisionExplanation from '../../components/ui/DecisionExplanation';
import { SimpleBarChart } from '../../components/Charts';
import { Button } from '../../components/ui/Button';
import { generatePDF, buildFileName } from '../../lib/pdfGenerator';

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
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    const { allMaterials = [], lowStock = [], deadStock = [] } = health || {};

    const exportForecast = () => {
        if (!Array.isArray(forecast)) return;

        generatePDF({
            title: "REORDER FORECAST",
            reportType: "Forecast Analysis",
            generatedBy: "System (Admin)",
            fileName: buildFileName('Reorder-Forecast'),
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
                    <h3 className="text-xl font-bold font-heading text-primary border-b pb-2">Inventory Health & Distribution</h3>
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
                    <div className="industrial-card p-6 h-96 bg-card rounded-xl shadow-lg border border-subtle">
                        <h3 className="text-xl font-bold text-primary mb-6 font-heading">Stock Distribution</h3>
                        <SimpleBarChart
                            data={[
                                { name: 'Healthy', value: allMaterials.length - lowStock.length - deadStock.length },
                                { name: 'Low', value: lowStock.length },
                                { name: 'Dead', value: deadStock.length }
                            ]}
                            xKey="name"
                            yKey="value"
                            color="#d4a853"
                            name="Items"
                        />
                    </div>

                    <div className="industrial-card p-0 bg-card rounded-xl shadow-lg border border-subtle overflow-hidden flex flex-col h-96">
                        <div className="p-6 border-b border-subtle bg-canvas/50">
                            <h3 className="text-lg font-bold text-primary font-heading">Critical Low Stock List</h3>
                        </div>
                        <div className="overflow-auto flex-1 p-0">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-secondary uppercase text-xs sticky top-0 bg-elevated border-b border-subtle">
                                    <tr>
                                        <th className="px-6 py-3.5 font-bold tracking-wider">Material</th>
                                        <th className="px-6 py-3.5 text-right font-bold tracking-wider">Coverage</th>
                                        <th className="px-6 py-3.5 text-center font-bold tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle">
                                    {lowStock.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-muted italic">No critical items.</td></tr>
                                    ) : lowStock.map((m: any) => (
                                        <tr key={m.materialId} className="hover:bg-status-danger/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-primary font-heading">{m.name}</td>
                                            <td className="px-6 py-4 text-right font-bold text-status-danger tabular-nums font-mono">{m.daysRemaining} <span className="text-xs text-muted ml-0.5">days</span></td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider bg-status-danger/10 border border-status-danger/30 text-status-danger shadow-[0_0_8px_rgba(201,62,62,0.15)]">
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
                    <div className="bg-card p-5 rounded-xl shadow-lg border border-status-warning/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-status-warning/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex items-center gap-2 text-status-warning font-bold mb-4 relative z-10 font-heading">
                            <Layers className="h-5 w-5" /> Dead Stock List (Zero consumption in 30 days)
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
                            {deadStock.map((item: any) => (
                                <li key={item.materialId} className="flex justify-between items-center text-sm border border-status-warning/20 bg-status-warning/5 p-3 rounded-lg backdrop-blur-sm shadow-sm transition-all hover:border-status-warning/40">
                                    <span className="font-bold text-primary font-heading">{item.name}</span>
                                    <span className="text-xs text-status-warning font-bold font-mono uppercase tracking-wider bg-status-warning/10 px-2 py-1 rounded">Qty: {item.currentStock}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Forecast Section */}
            {Array.isArray(forecast) && (
                <div className="space-y-6 pt-6 border-t border-subtle">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold font-heading text-primary flex items-center gap-2">
                                <TrendingUp className="h-6 w-6 text-brand-primary" /> Reorder Forecast
                            </h3>
                            <p className="text-sm text-secondary mt-1">AI-driven suggestions based on continuous consumption rates.</p>
                            <p className="text-[10px] text-muted font-mono uppercase tracking-widest mt-2 border-l-2 border-brand-primary/30 pl-2 py-0.5">
                                Forecast based on last 30 days. Includes 15-day safety buffer + 7 days lead.
                            </p>
                        </div>
                        <Button onClick={exportForecast} variant="primary" className="gap-2 bg-brand-primary text-white hover:bg-brand-primary/90 border-none font-bold shadow-md">
                            <Download className="w-4 h-4" /> Export PDF Report
                        </Button>
                    </div>

                    <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left border-collapse">
                                <thead className="bg-elevated border-b border-subtle text-xs font-bold text-secondary uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Material</th>
                                        <th className="px-6 py-4 text-right">Current Stock</th>
                                        <th className="px-6 py-4 text-right">Avg Daily Use</th>
                                        <th className="px-6 py-4 text-right">7-Day Forecast</th>
                                        <th className="px-6 py-4 text-right">Suggested Reorder</th>
                                        <th className="px-6 py-4 text-center">Status Requirement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle">
                                    {forecast.map((item: any) => (
                                        <tr key={item.materialId} className="hover:bg-canvas/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-primary font-heading whitespace-nowrap">{item.name}</td>
                                            <td className="px-6 py-4 text-right text-secondary font-mono">{item.currentStock}</td>
                                            <td className="px-6 py-4 text-right text-secondary font-mono">{item.avgDaily}</td>
                                            <td className="px-6 py-4 text-right text-secondary font-mono">{item.forecast7Days}</td>
                                            <td className="px-6 py-4 text-right font-bold text-primary font-mono text-base">{item.suggestedReorder}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border shadow-sm ${item.status === 'REORDER_NOW'
                                                    ? 'bg-status-danger/10 text-status-danger border-status-danger/30 shadow-status-danger/10'
                                                    : 'bg-status-success/10 text-status-success border-status-success/30 shadow-status-success/10'
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
