import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CircleDashed, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { useBatchUpdates } from '../../hooks/useProduction';

const LiveMonitor = () => {
    // Enable the socket real-time hook
    useBatchUpdates();

    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'IDLE'>('ALL');

    const { data: monitorData = { activeBatches: [], machines: [] }, isLoading } = useQuery({
        queryKey: ['monitor-dashboard'],
        queryFn: async () => (await api.get('/production-batches/monitor')).data,
        refetchInterval: 30000 // Fallback polling every 30s as requested by Senior Dev, even though sockets are connected
    });

    const getMachineStatusCard = (machine: any) => {
        const activeBatch = monitorData.activeBatches?.find((b: any) =>
            b.machineId?._id === machine._id || b.machineId === machine._id
        );

        const isRunning = !!activeBatch;

        if (filter === 'ACTIVE' && !isRunning) return null;
        if (filter === 'IDLE' && isRunning) return null;

        return (
            <div key={machine._id} className={`p-5 rounded-2xl border-2 transition-all duration-500 ${isRunning
                ? 'bg-blue-50 border-blue-200 shadow-md shadow-blue-100/50 scale-[1.02]'
                : 'bg-white border-gray-100 hover:border-gray-200'
                }`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{machine.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{machine.machineId}</p>
                    </div>
                    {isRunning ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-blue-600"></span> RUNNING
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                            <CircleDashed className="h-3 w-3" /> IDLE
                        </div>
                    )}
                </div>

                {isRunning ? (
                    <div className="space-y-3">
                        <div className="bg-white/60 p-3 rounded-lg border border-blue-100/50">
                            <div className="text-xs text-blue-600 font-bold mb-1">Batch #{activeBatch.batchNumber}</div>
                            <div className="text-sm text-gray-800 font-medium">Shade: {activeBatch.shadeTarget}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Started: {new Date(activeBatch.startTime).toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            Supervisor: {activeBatch.supervisorId?.username || 'Unknown'}
                        </div>
                    </div>
                ) : (
                    <div className="py-6 text-center">
                        <p className="text-gray-400 text-sm font-medium">Machine Ready</p>
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 flex justify-center items-center h-[60vh]"><Activity className="animate-spin h-8 w-8 text-indigo-500" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Activity className="h-8 w-8 text-blue-600" />
                        Live Plant Monitor
                    </h2>
                    <p className="text-gray-500 mt-1">Real-time status of all dyeing machines and active batches</p>
                </div>

                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('ACTIVE')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filter === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Running
                    </button>
                    <button
                        onClick={() => setFilter('IDLE')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filter === 'IDLE' ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Idle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {monitorData.machines?.filter((m: any) => m.status === 'ACTIVE').map((machine: any) => getMachineStatusCard(machine))}
            </div>

            {(monitorData.machines?.length === 0 || !monitorData.machines) && (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500">No active machines found in the system.</p>
                </div>
            )}
        </div>
    );
};

export default LiveMonitor;
