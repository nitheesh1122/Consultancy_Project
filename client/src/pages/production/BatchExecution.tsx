import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import api from '../../lib/api';

const BatchExecution = () => {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const queryClient = useQueryClient();

 // Fetches
 const { data: batch, isLoading: isBatchLoading } = useQuery({
 queryKey: ['batch', id],
 queryFn: async () => (await api.get(`/production-batches/${id}`)).data,
 refetchInterval: (data: any) => data?.status === 'IN_PROGRESS' ? 10000 : false, // Poll if active in case websockets fail
 });

 const { data: availableWorkers = [], isLoading: isWorkersLoading } = useQuery({
 queryKey: ['available-workers'],
 queryFn: async () => (await api.get('/workers/available')).data,
 enabled: batch?.status === 'SCHEDULED' // Only fetch if we need to assign
 });

 // Start State
 const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

 // Complete State
 const [completeData, setCompleteData] = useState({
 outputFirstGradeKg: 0,
 outputSecondGradeKg: 0,
 rejectionKg: 0
 });

 const [errorMsg, setErrorMsg] = useState('');

 const startMutation = useMutation({
 mutationFn: (workers: string[]) => api.put(`/production-batches/${id}/start`, { assignedWorkers: workers }),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['batch', id] });
 queryClient.invalidateQueries({ queryKey: ['available-workers'] });
 setErrorMsg('');
 },
 onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to start batch')
 });

 const completeMutation = useMutation({
 mutationFn: (data: any) => api.put(`/production-batches/${id}/complete`, data),
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['batch', id] });
 setErrorMsg('');
 },
 onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to complete batch')
 });

 const toggleWorker = (workerId: string) => {
 setSelectedWorkers(prev =>
 prev.includes(workerId) ? prev.filter(w => w !== workerId) : [...prev, workerId]
 );
 };

 const handleStart = () => {
 if (selectedWorkers.length === 0) {
 setErrorMsg('Please assign at least one worker.');
 return;
 }
 startMutation.mutate(selectedWorkers);
 };

 const handleComplete = (e: React.FormEvent) => {
 e.preventDefault();
 const totalOut = Number(completeData.outputFirstGradeKg) + Number(completeData.outputSecondGradeKg) + Number(completeData.rejectionKg);
 if (totalOut > batch.inputKg) {
 if (!window.confirm(`Warning: Total output (${totalOut}kg) exceeds input (${batch.inputKg}kg). Continue?`)) {
 return;
 }
 }
 completeMutation.mutate(completeData);
 };

 if (isBatchLoading) return <div className="p-8 text-center text-secondary">Loading batch details...</div>;
 if (!batch) return <div className="p-8 text-center text-danger">Batch not found</div>;

 const isScheduled = batch.status === 'SCHEDULED';
 const isInProgress = batch.status === 'IN_PROGRESS';
 const isCompleted = batch.status === 'COMPLETED';

 return (
 <div className="max-w-4xl mx-auto space-y-6 pb-20">
 {/* Header */}
 <div className="flex items-center gap-4">
 <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-surface-highlight rounded-full text-secondary" aria-label="Go back">
 <ArrowLeft className="h-5 w-5" />
 </button>
 <div>
 <h2 className="text-2xl font-bold font-mono text-primary">
 {batch.batchNumber}
 </h2>
 <p className="text-secondary">
 {batch.machineId?.name} • {batch.lotNumber} • {batch.fabricType}
 </p>
 </div>
 <div className="ml-auto">
 <span className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-lg border ${isScheduled ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
 isInProgress ? 'bg-blue-100 text-blue-800 border-blue-600 animate-pulse outline outline-2 outline-offset-2 outline-blue-400' :
 'bg-green-100 text-green-800 border-green-200'
 }`}>
 {batch.status.replace('_', ' ')}
 </span>
 </div>
 </div>

 {errorMsg && (
 <div className="bg-danger/10 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-danger/30">
 <AlertTriangle className="h-5 w-5" />
 {errorMsg}
 </div>
 )}

 {/* Main Info Card */}
 <div className="bg-surface rounded-xl shadow-sm border border-border p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
 <div>
 <div className="text-sm text-secondary mb-1">Input Weight</div>
 <div className="text-xl font-bold text-primary">{batch.inputKg} <span className="text-sm font-medium">kg</span></div>
 </div>
 <div>
 <div className="text-sm text-secondary mb-1">Target Shade</div>
 <div className="text-lg font-bold text-primary">{batch.shadeTarget}</div>
 </div>
 <div>
 <div className="text-sm text-secondary mb-1">Rolls</div>
 <div className="text-lg font-bold text-primary">{batch.rolls}</div>
 </div>
 <div>
 <div className="text-sm text-secondary mb-1">Shift</div>
 <div className="text-lg font-bold text-primary">{batch.shift}</div>
 </div>
 </div>

 {/* ACTION: START BATCH */}
 {isScheduled && (
 <div className="bg-surface rounded-xl shadow-sm border border-primary/20 overflow-hidden">
 <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
 <h3 className="font-bold text-primary flex items-center gap-2">
 <Users className="h-5 w-5" /> Assign Workers & Start
 </h3>
 </div>
 <div className="p-6 space-y-6">
 {isWorkersLoading ? (
 <p className="text-secondary">Loading available workers...</p>
 ) : availableWorkers.length === 0 ? (
 <p className="text-danger font-medium">No active workers available. Add or free up workers first.</p>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
 {availableWorkers.map((w: any) => (
 <label key={w._id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedWorkers.includes(w._id) ? 'border-primary bg-primary/10' : 'border-border hover:bg-background'}`}>
 <input
 type="checkbox"
 checked={selectedWorkers.includes(w._id)}
 onChange={() => toggleWorker(w._id)}
 className="mt-1 h-4 w-4 text-primary rounded border-border focus:ring-primary"
 />
 <div>
 <div className="font-semibold text-primary">{w.name}</div>
 <div className="text-xs text-secondary uppercase">{w.role}</div>
 </div>
 </label>
 ))}
 </div>
 )}

 <div className="pt-4 border-t border-border">
 {/* Mobile-friendly huge button for supervisor */}
 <button
 onClick={handleStart}
 disabled={startMutation.isPending || selectedWorkers.length === 0}
 className="w-full py-4 bg-primary text-white rounded-xl text-lg font-bold hover:bg-primary-hover transition flex items-center justify-center gap-3 shadow-md disabled:opacity-50"
 >
 <Play className="h-6 w-6" fill="currentColor" />
 {startMutation.isPending ? 'STARTING...' : 'START BATCH EXECUTION'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* IN PROGRESS: CURRENT ASSIGNMENTS */}
 {(isInProgress || isCompleted) && (
 <div className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
 <h3 className="font-bold text-primary border-b pb-2">Assigned Personnel</h3>
 <div className="flex flex-wrap gap-4">
 {batch.assignedWorkers?.map((w: any) => (
 <div key={w._id} className="bg-background border border-border rounded-lg px-4 py-3 flex-1 min-w-[200px]">
 <div className="font-bold text-primary">{w.name}</div>
 <div className="text-xs text-primary font-bold tracking-wider">{w.role}</div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ACTION: COMPLETE BATCH */}
 {isInProgress && (
 <div className="bg-surface rounded-xl shadow-sm border border-blue-200 overflow-hidden">
 <div className="bg-blue-600 px-6 py-4">
 <h3 className="font-bold text-primary flex items-center gap-2">
 <CheckCircle className="h-5 w-5" /> Complete Execution & Log Output
 </h3>
 </div>
 <form onSubmit={handleComplete} className="p-6 space-y-6">
 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
 <p className="text-sm font-medium text-blue-800">
 Verify physical weights before submitting. Input was <span className="font-bold font-mono text-lg">{batch.inputKg} kg</span>.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div>
 <label className="block text-sm font-bold text-primary mb-2" htmlFor="output-first-grade">1st Grade Output (Kg)</label>
 <input
 id="output-first-grade"
 required type="number" min="0" step="0.1"
 value={completeData.outputFirstGradeKg}
 onChange={e => setCompleteData({ ...completeData, outputFirstGradeKg: Number(e.target.value) })}
 className="w-full border-2 border-border rounded-lg px-4 py-3 text-xl font-mono focus:border-blue-500 focus:ring-0 outline-none"
 aria-label="1st grade output in kg"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-primary mb-2" htmlFor="output-second-grade">2nd Grade Output (Kg)</label>
 <input
 id="output-second-grade"
 required type="number" min="0" step="0.1"
 value={completeData.outputSecondGradeKg}
 onChange={e => setCompleteData({ ...completeData, outputSecondGradeKg: Number(e.target.value) })}
 className="w-full border-2 border-border rounded-lg px-4 py-3 text-xl font-mono focus:border-blue-500 focus:ring-0 outline-none"
 aria-label="2nd grade output in kg"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-red-700 mb-2" htmlFor="rejection-kg">Rejection (Kg)</label>
 <input
 id="rejection-kg"
 required type="number" min="0" step="0.1"
 value={completeData.rejectionKg}
 onChange={e => setCompleteData({ ...completeData, rejectionKg: Number(e.target.value) })}
 className="w-full border-2 border-red-300 bg-danger/10 rounded-lg px-4 py-3 text-xl font-mono focus:border-red-500 focus:ring-0 outline-none"
 aria-label="Rejection in kg"
 />
 </div>
 </div>

 <div className="pt-6 border-t border-border">
 <button
 type="submit"
 disabled={completeMutation.isPending}
 className="w-full py-4 bg-green-600 text-primary rounded-xl text-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-3 shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none"
 >
 <CheckCircle className="h-6 w-6" />
 {completeMutation.isPending ? 'PROCESSING...' : 'FINISH & CALCULATE YIELD'}
 </button>
 </div>
 </form>
 </div>
 )}

 {/* COMPLETED: YIELD RESULTS */}
 {isCompleted && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-surface-highlight rounded-xl shadow-lg p-6 text-primary text-center">
 <div className="text-green-100 font-medium mb-2 uppercase tracking-wide text-sm">Quality Yield</div>
 <div className="text-5xl font-black">{batch.qualityYieldPercentage || batch.yieldPercentage}%</div>
 <div className="text-green-100 text-sm mt-3">Ready for dispatch</div>
 </div>

 <div className="bg-surface border-2 border-primary/20 rounded-xl shadow-sm p-6 text-center flex flex-col justify-center">
 <div className="text-secondary font-medium mb-1 uppercase tracking-wide text-sm">Recovered Rejection</div>
 <div className="text-3xl font-bold text-primary">{batch.rejectionKg} <span className="text-lg">kg</span></div>
 </div>

 <div className="bg-surface border-2 border-red-100 rounded-xl shadow-sm p-6 text-center flex flex-col justify-center">
 <div className="text-secondary font-medium mb-1 uppercase tracking-wide text-sm">Unrecoverable Wastage</div>
 <div className="text-3xl font-bold text-danger">{batch.wastagePercentage}%</div>
 <div className="text-sm text-secondary mt-1">
 {batch.wastage?.reason || 'Process Loss'}
 </div>
 </div>

 <div className="col-span-full border border-border rounded-lg p-4 bg-background flex items-center justify-between">
 <div>
 <p className="text-sm text-secondary">Total Yield (All recovered outputs): <strong className="text-primary">{batch.yieldPercentage}%</strong></p>
 <p className="text-sm text-secondary">Calculated Utility Cost: <strong className="text-primary">₹{batch.utilities?.calculatedCost?.toFixed(2) || '0.00'}</strong></p>
 </div>
 <CheckCircle className="h-8 w-8 text-green-500" />
 </div>
 </div>
 )}
 </div>
 );
};

export default BatchExecution;
