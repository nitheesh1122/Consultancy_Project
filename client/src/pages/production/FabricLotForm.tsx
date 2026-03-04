import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../../lib/api';

interface FabricLotFormProps {
 lot?: any;
 onClose: () => void;
}

const FabricLotForm = ({ lot, onClose }: FabricLotFormProps) => {
 const queryClient = useQueryClient();
 const [errorMsg, setErrorMsg] = useState('');
 const [formData, setFormData] = useState({
 lotNumber: '',
 supplierParty: '',
 fabricType: '',
 gsm: '',
 totalRolls: '',
 totalWeightKg: '',
 receivedDate: new Date().toISOString().split('T')[0],
 status: 'PENDING'
 });

 useEffect(() => {
 if (lot) {
 setFormData({
 lotNumber: lot.lotNumber,
 supplierParty: lot.supplierParty,
 fabricType: lot.fabricType,
 gsm: lot.gsm || '',
 totalRolls: lot.totalRolls || '',
 totalWeightKg: lot.totalWeightKg || '',
 receivedDate: new Date(lot.receivedDate).toISOString().split('T')[0],
 status: lot.status
 });
 }
 }, [lot]);

 const saveMutation = useMutation({
 mutationFn: async (data: any) => {
 if (lot) {
 return await api.put(`/fabric-lots/${lot._id}`, data);
 } else {
 return await api.post('/fabric-lots', data);
 }
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['fabric-lots'] });
 onClose();
 },
 onError: (err: any) => {
 setErrorMsg(err.response?.data?.message || 'Failed to save fabric lot');
 }
 });

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMsg('');
 saveMutation.mutate({
 ...formData,
 gsm: formData.gsm ? Number(formData.gsm) : undefined,
 totalRolls: formData.totalRolls ? Number(formData.totalRolls) : undefined,
 totalWeightKg: Number(formData.totalWeightKg)
 });
 };

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
 <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
 <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background/50">
 <h3 className="text-lg font-bold text-primary">
 {lot ? 'Edit Fabric Lot' : 'Receive New Fabric Lot'}
 </h3>
 <button onClick={onClose} className="text-muted hover:text-secondary">
 <X className="h-5 w-5" />
 </button>
 </div>

 {errorMsg && (
 <div className="bg-danger/10 text-red-700 p-3 mx-6 mt-4 rounded-lg border border-red-100 text-sm">
 {errorMsg}
 </div>
 )}

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Lot Number / ID *</label>
 <input
 required
 type="text"
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.lotNumber}
 onChange={e => setFormData({ ...formData, lotNumber: e.target.value })}
 placeholder="e.g. L-2024-001"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Supplier Party *</label>
 <input
 required
 type="text"
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.supplierParty}
 onChange={e => setFormData({ ...formData, supplierParty: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1">Fabric Type *</label>
 <input
 required
 type="text"
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.fabricType}
 onChange={e => setFormData({ ...formData, fabricType: e.target.value })}
 placeholder="e.g. 100% Cotton Single Jersey"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">GSM</label>
 <input
 type="number"
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.gsm}
 onChange={e => setFormData({ ...formData, gsm: e.target.value })}
 placeholder="e.g. 180"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1">Total Received Wt (Kg) *</label>
 <input
 required
 type="number"
 min="1"
 step="0.1"
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.totalWeightKg}
 onChange={e => setFormData({ ...formData, totalWeightKg: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Total Rolls</label>
 <input
 type="number"
 min="1"
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.totalRolls}
 onChange={e => setFormData({ ...formData, totalRolls: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-primary mb-1">Received Date *</label>
 <input
 required
 type="date"
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.receivedDate}
 onChange={e => setFormData({ ...formData, receivedDate: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Status</label>
 <select
 className="w-full rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary"
 value={formData.status}
 onChange={e => setFormData({ ...formData, status: e.target.value })}
 >
 <option value="PENDING">PENDING</option>
 <option value="IN_PRODUCTION">IN PRODUCTION</option>
 <option value="COMPLETED">COMPLETED</option>
 </select>
 </div>
 </div>

 <div className="pt-4 flex justify-end gap-3 border-t border-border">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-sm font-medium text-primary hover:bg-background rounded-lg border border-border"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={saveMutation.isPending}
 className="px-4 py-2 text-sm font-medium text-primary bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50"
 >
 {saveMutation.isPending ? 'Saving...' : 'Save Fabric Lot'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default FabricLotForm;
