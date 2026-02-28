import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Activity, Play, Plus } from 'lucide-react';
import api from '../../lib/api';

const MyBatches = () => {
    const navigate = useNavigate();

    const { data: batches = [], isLoading } = useQuery({
        queryKey: ['production-batches'],
        queryFn: async () => {
            const res = await api.get('/production-batches');
            // In a real app with proper my-assignments endpoint, we would filter on backend.
            // For now, GET /production-batches returns all, we filter by SCHEDULED / IN_PROGRESS
            return res.data;
        }
    });

    const activeBatches = batches.filter((b: any) => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-indigo-600" />
                        My Batches
                    </h2>
                    <p className="text-gray-500">Manage your currently assigned production batches</p>
                </div>
                <button
                    onClick={() => navigate('/production/schedule')}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="h-4 w-4" /> Schedule New
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading your batches...</div>
                ) : activeBatches.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
                        No active or scheduled batches found. Click "Schedule New" to begin.
                    </div>
                ) : (
                    activeBatches.map((batch: any) => (
                        <div key={batch._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                            <div className={`px-4 py-3 border-b flex justify-between items-center ${batch.status === 'IN_PROGRESS' ? 'bg-blue-50/50' : ''}`}>
                                <h3 className="font-bold font-mono text-gray-900">{batch.batchNumber}</h3>
                                <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(batch.status)}`}>
                                    {batch.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-gray-500">Machine:</div>
                                    <div className="font-medium text-gray-900 text-right">{batch.machineId?.name || 'Unknown'}</div>

                                    <div className="text-gray-500">Lot & Fabric:</div>
                                    <div className="font-medium text-gray-900 text-right">{batch.lotNumber} ({batch.fabricType})</div>

                                    <div className="text-gray-500">Input Kg:</div>
                                    <div className="font-medium text-gray-900 text-right">{batch.inputKg} kg ({batch.rolls} rolls)</div>

                                    <div className="text-gray-500">Shade:</div>
                                    <div className="font-medium text-gray-900 text-right">{batch.shadeTarget}</div>
                                </div>
                            </div>
                            <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
                                <button
                                    onClick={() => navigate(`/production/batch/${batch._id}/execute`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition w-full justify-center shadow-sm"
                                >
                                    {batch.status === 'SCHEDULED' ? (
                                        <><Play className="h-4 w-4" /> Start Execution</>
                                    ) : (
                                        <><Activity className="h-4 w-4" /> Go to Execution View</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Show recently completed batches briefly at the bottom */}
            <div className="pt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recently Completed</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yield</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Input</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {batches.filter((b: any) => b.status === 'COMPLETED').slice(0, 5).map((batch: any) => (
                                <tr key={batch._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/production/batch/${batch._id}/execute`)}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium font-mono text-gray-900">{batch.batchNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(batch.scheduledDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.machineId?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{batch.qualityYieldPercentage || batch.yieldPercentage}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.inputKg} kg</td>
                                </tr>
                            ))}
                            {batches.filter((b: any) => b.status === 'COMPLETED').length === 0 && (
                                <tr><td colSpan={5} className="text-center py-4 text-gray-500">No completed batches today.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyBatches;
