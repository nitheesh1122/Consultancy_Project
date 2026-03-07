import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Save, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { useCreateBatch } from '../../hooks/useProduction';

const ScheduleBatch = () => {
 const navigate = useNavigate();
 const createBatchMutation = useCreateBatch();
 const [errorMsg, setErrorMsg] = useState('');

 const [formData, setFormData] = useState({
 machineId: '',
 scheduledDate: new Date().toISOString().split('T')[0],
 shift: 'MORNING',
 lotNumber: '',
 fabricType: '',
 gsm: '',
 inputKg: '',
 rolls: '',
 supplierParty: '',
 shadeTarget: '',
 selectedLotId: ''
 });

 const { data: machines = [], isLoading: machinesLoading } = useQuery({
 queryKey: ['machines'],
 queryFn: async () => {
 const res = await api.get('/machines');
 // Only ACTIVE machines should be available for scheduling
 return res.data.filter((m: any) => m.status === 'ACTIVE');
 }
 });

 const { data: lots = [], isLoading: lotsLoading } = useQuery({
 queryKey: ['pending-lots'],
 queryFn: async () => {
 const res = await api.get('/fabric-lots', { params: { status: 'PENDING' } });
 return res.data;
 }
 });

 const handleLotSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const lotId = e.target.value;
 const selectedLot = lots.find((l: any) => l._id === lotId);

 if (selectedLot) {
 setFormData({
 ...formData,
 selectedLotId: lotId,
 lotNumber: selectedLot.lotNumber,
 fabricType: selectedLot.fabricType,
 gsm: selectedLot.gsm?.toString() || '',
 inputKg: selectedLot.totalWeightKg?.toString() || '',
 rolls: selectedLot.totalRolls?.toString() || '',
 supplierParty: selectedLot.supplierParty
 });
 } else {
 setFormData({
 ...formData,
 selectedLotId: '',
 lotNumber: '',
 fabricType: '',
 gsm: '',
 inputKg: '',
 rolls: '',
 supplierParty: ''
 });
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMsg('');
 try {
 const payload = { ...formData, inputKg: Number(formData.inputKg), rolls: Number(formData.rolls) };
 await createBatchMutation.mutateAsync(payload);
 navigate('/production/my-batches');
 } catch (err: any) {
 setErrorMsg(err.response?.data?.message || 'Failed to schedule batch. Try again.');
 }
 };

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-surface-highlight rounded-full text-secondary" aria-label="Go back">
 <ArrowLeft className="h-5 w-5" />
 </button>
 <div>
 <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
 <CalendarClock className="h-6 w-6 text-primary" />
 Schedule New Batch
 </h2>
 <p className="text-secondary">Plan production for a specific machine and shift</p>
 </div>
 </div>
 </div>

 {errorMsg && (
 <div className="bg-danger/10 text-red-700 p-4 rounded-lg border border-red-100">
 {errorMsg}
 </div>
 )}

 <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-6" aria-labelledby="schedule-form-heading">
 <fieldset className="border-0 p-0 m-0 min-w-0 space-y-6">
 <legend id="schedule-form-heading" className="text-lg font-bold text-primary mb-4 sr-only">Schedule New Batch</legend>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Scheduling Details */}
 <div className="space-y-4">
 <h3 className="font-semibold text-primary border-b pb-2">Schedule Details</h3>
 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="schedule-machine">Machine</label>
 <select
 id="schedule-machine"
 required
 value={formData.machineId}
 onChange={e => setFormData({ ...formData, machineId: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
 aria-label="Select machine"
 >
 <option value="" disabled>Select a machine...</option>
 {machines.map((m: any) => (
 <option key={m._id} value={m._id}>{m.name} ({m.capacityKg}kg)</option>
 ))}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="schedule-date">Date</label>
 <input
 id="schedule-date"
 required type="date"
 value={formData.scheduledDate}
 onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
 min={new Date().toISOString().split('T')[0]}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
 aria-label="Scheduled date"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="schedule-shift">Shift</label>
 <select
 id="schedule-shift"
 value={formData.shift}
 onChange={e => setFormData({ ...formData, shift: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
 aria-label="Select shift"
 >
 <option value="MORNING">Morning (06:00 - 14:00)</option>
 <option value="EVENING">Evening (14:00 - 22:00)</option>
 <option value="NIGHT">Night (22:00 - 06:00)</option>
 </select>
 </div>
 </div>
 </div>

 {/* Material Details */}
 <div className="space-y-4">
 <div className="border-b pb-2 flex justify-between items-center">
 <h3 className="font-semibold text-primary">Material / Lot Info</h3>
 <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Select a Pending Lot to Auto-fill</span>
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="pending-lot">Select Pending Fabric Lot</label>
 <select
 id="pending-lot"
 value={formData.selectedLotId}
 onChange={handleLotSelect}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-primary/10 mb-2 font-medium text-primary"
 aria-label="Select pending fabric lot"
 >
 <option value="">-- Manual Entry --</option>
 {lots.map((l: any) => (
 <option key={l._id} value={l._id}>
 {l.lotNumber} - {l.fabricType} ({l.totalWeightKg}kg from {l.supplierParty})
 </option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="schedule-lot-number">Lot Number</label>
 <input
 id="schedule-lot-number"
 required type="text"
 placeholder="e.g. L-12345"
 value={formData.lotNumber}
 onChange={e => setFormData({ ...formData, lotNumber: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 font-mono uppercase focus:ring-2 focus:ring-primary outline-none bg-background"
 readOnly={!!formData.selectedLotId}
 aria-label="Lot number"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="schedule-supplier">Supplier Party</label>
 <input
 id="schedule-supplier"
 required type="text"
 placeholder="Supplier or party name"
 value={formData.supplierParty}
 onChange={e => setFormData({ ...formData, supplierParty: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-background"
 readOnly={!!formData.selectedLotId}
 aria-label="Supplier party"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="schedule-fabric-type">Fabric Type</label>
 <input
 id="schedule-fabric-type"
 required type="text"
 placeholder="e.g. 100% Cotton"
 value={formData.fabricType}
 onChange={e => setFormData({ ...formData, fabricType: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-background"
 readOnly={!!formData.selectedLotId}
 aria-label="Fabric type"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="schedule-gsm">GSM</label>
 <input
 id="schedule-gsm"
 required type="text"
 placeholder="e.g. 180"
 value={formData.gsm}
 onChange={e => setFormData({ ...formData, gsm: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none bg-background"
 readOnly={!!formData.selectedLotId}
 aria-label="GSM"
 />
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-1">
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="input-kg">Input (Kg)</label>
 <input
 id="input-kg"
 required type="number" min="1" step="0.1"
 value={formData.inputKg}
 onChange={e => setFormData({ ...formData, inputKg: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
 aria-label="Input in kg"
 />
 </div>
 <div className="col-span-1">
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="rolls">Rolls</label>
 <input
 id="rolls"
 required type="number" min="1"
 value={formData.rolls}
 onChange={e => setFormData({ ...formData, rolls: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
 aria-label="Number of rolls"
 />
 </div>
 <div className="col-span-1">
 <label className="block text-sm font-medium text-primary mb-1" htmlFor="shade-target">Shade Target</label>
 <input
 id="shade-target"
 required type="text"
 placeholder="Navy Blue"
 aria-label="Shade target"
 value={formData.shadeTarget}
 onChange={e => setFormData({ ...formData, shadeTarget: e.target.value })}
 className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
 />
 </div>
 </div>
 </div>
 </div>

 <div className="pt-6 border-t border-border flex justify-end gap-4">
 <button
 type="button"
 onClick={() => navigate(-1)}
 className="px-6 py-2.5 text-sm font-medium text-primary bg-surface-highlight hover:bg-surface-highlight rounded-lg transition"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={createBatchMutation.isPending || machinesLoading}
 className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg flex items-center gap-2 transition disabled:opacity-50"
 >
 <Save className="h-4 w-4" />
 {createBatchMutation.isPending ? 'Scheduling...' : 'Schedule Batch'}
 </button>
 </div>
 </fieldset>
 </form>
 </div>
 );
};

export default ScheduleBatch;
