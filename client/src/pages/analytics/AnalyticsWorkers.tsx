import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const AnalyticsWorkers = () => {
    const { data: performance = [], isLoading: isLoadingPerf } = useQuery({
        queryKey: ['worker-performance'],
        queryFn: async () => {
            const res = await api.get('/analytics/workers/performance');
            return res.data;
        }
    });

    const { data: efficiency = [], isLoading: isLoadingEff } = useQuery({
        queryKey: ['worker-efficiency'],
        queryFn: async () => {
            const res = await api.get('/analytics/workers/efficiency');
            return res.data;
        }
    });

    if (isLoadingPerf || isLoadingEff) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-600" /> Supervisor Yield Output
                        </h3>
                    </div>
                    {performance.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No batch data available.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Batches</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Yield</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Wastage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {performance.map((p: any) => (
                                    <tr key={p.supervisorName}>
                                        <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{p.supervisorName}</td>
                                        <td className="px-5 py-3 whitespace-nowrap text-right text-sm text-gray-500">{p.totalBatches}</td>
                                        <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-green-600">{p.avgYield}%</td>
                                        <td className="px-5 py-3 whitespace-nowrap text-right font-medium text-red-500">{p.avgWastage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" /> Worker Efficiency
                        </h3>
                    </div>
                    {efficiency.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No worker allocation data available.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Batches Involved</th>
                                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Yield</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {efficiency.map((w: any) => (
                                    <tr key={w.workerName}>
                                        <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{w.workerName}</td>
                                        <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-gray-500">{w.workerRole}</td>
                                        <td className="px-5 py-3 whitespace-nowrap text-right text-sm text-gray-500">{w.totalBatches}</td>
                                        <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-indigo-600">{w.avgYield}%</td>
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
