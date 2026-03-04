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
            <div key={machine._id} className={`p-5 rounded-2xl border transition-all duration-500 ${isRunning
                ? 'bg-status-success/10 border-status-success/50 shadow-lg shadow-status-success/5 scale-[1.02]'
                : 'bg-card border-subtle hover:border-brand-primary/50'
                }`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-primary text-lg font-heading">{machine.name}</h3>
                        <p className="text-sm text-secondary font-mono tracking-tight">{machine.machineId}</p>
                    </div>
                    {isRunning ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-status-success/20 text-status-success rounded-sm text-xs font-bold uppercase tracking-wider animate-pulse border border-status-success/30">
                            <span className="h-2 w-2 rounded-full bg-status-success"></span> RUNNING
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-elevated text-secondary border border-subtle rounded-sm text-xs font-bold uppercase tracking-wider">
                            <CircleDashed className="h-3 w-3" /> IDLE
                        </div>
                    )}
                </div>

                {isRunning ? (
                    <div className="space-y-3">
                        <div className="bg-canvas/60 p-4 rounded-lg border border-status-success/20">
                            <div className="text-xs text-status-success font-bold font-heading uppercase tracking-wider mb-1">Batch #{activeBatch.batchNumber}</div>
                            <div className="text-sm text-primary font-bold">Shade: {activeBatch.shadeTarget}</div>
                            <div className="text-xs text-secondary font-mono mt-1.5">
                                Started: {new Date(activeBatch.startTime).toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="text-xs text-secondary font-bold font-mono tracking-tight uppercase">
                            Supervisor: {activeBatch.supervisorId?.username || 'Unknown'}
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center bg-canvas/30 rounded-lg border border-transparent border-dashed">
                        <p className="text-muted text-xs font-bold uppercase tracking-wider">Machine Ready</p>
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) return <div className="p-8 text-center text-secondary flex justify-center items-center h-[60vh]"><Activity className="animate-spin h-8 w-8 text-brand-primary" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-subtle pb-4">
                <div>
                    <h2 className="text-3xl font-bold font-heading text-primary flex items-center gap-3">
                        <Activity className="h-8 w-8 text-brand-primary animate-pulse" />
                        Live Plant Monitor
                    </h2>
                    <p className="text-secondary mt-1">Real-time status of all dyeing machines and active batches</p>
                </div>

                <div className="flex bg-elevated rounded-lg shadow-sm border border-subtle p-1.5 gap-1">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-1.5 text-xs uppercase tracking-wider font-bold rounded-md transition-all ${filter === 'ALL' ? 'bg-card text-brand-primary shadow-sm' : 'text-secondary hover:bg-canvas hover:text-primary'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('ACTIVE')}
                        className={`px-4 py-1.5 text-xs uppercase tracking-wider font-bold rounded-md transition-all ${filter === 'ACTIVE' ? 'bg-status-success/20 text-status-success shadow-sm border-status-success/30 border' : 'text-secondary hover:bg-canvas hover:text-primary border border-transparent'}`}
                    >
                        Running
                    </button>
                    <button
                        onClick={() => setFilter('IDLE')}
                        className={`px-4 py-1.5 text-xs uppercase tracking-wider font-bold rounded-md transition-all ${filter === 'IDLE' ? 'bg-card text-secondary shadow-sm' : 'text-secondary hover:bg-canvas hover:text-primary border border-transparent'}`}
                    >
                        Idle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {monitorData.machines?.filter((m: any) => m.status === 'ACTIVE').map((machine: any) => getMachineStatusCard(machine))}
            </div>

            {(monitorData.machines?.length === 0 || !monitorData.machines) && (
                <div className="text-center py-20 bg-canvas rounded-xl shadow-sm border border-subtle border-dashed">
                    <p className="text-secondary font-mono">No active machines found in the system.</p>
                </div>
            )}
        </div>
    );
};

export default LiveMonitor;
