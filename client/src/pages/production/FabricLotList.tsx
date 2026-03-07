import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import FabricLotForm from './FabricLotForm';

interface FabricLot {
 _id: string;
 lotNumber: string;
 supplierParty: string;
 fabricType: string;
 gsm?: number;
 totalRolls?: number;
 totalWeightKg: number;
 receivedDate: string;
 status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED';
}

const FabricLotList = () => {
 const queryClient = useQueryClient();
 const { user } = useAuth();
 const isSupervisor = user?.role === 'SUPERVISOR';

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingLot, setEditingLot] = useState<FabricLot | null>(null);

 const { data: lots = [], isLoading } = useQuery({
 queryKey: ['fabric-lots'],
 queryFn: async () => {
 const res = await api.get('/fabric-lots');
 return res.data;
 }
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: string) => await api.delete(`/fabric-lots/${id}`),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fabric-lots'] })
 });

 const openModal = (lot: FabricLot | null = null) => {
 setEditingLot(lot);
 setIsModalOpen(true);
 };

 const closeModal = () => {
 setIsModalOpen(false);
 setEditingLot(null);
 };

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
 <Layers className="h-6 w-6 text-primary" />
 Fabric Lots
 </h2>
 <p className="text-secondary">Manage incoming raw material lot allocations</p>
 </div>
 {isSupervisor && (
 <button
 onClick={() => openModal()}
 className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition"
 >
 <Plus className="h-4 w-4" /> Receive New Lot
 </button>
 )}
 </div>

 <div className="bg-surface rounded-xl shadow-sm overflow-hidden border border-border">
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-background">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Lot Info</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Supplier</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase">Qty (Kg / Rolls)</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Status</th>
 {isSupervisor && <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase">Actions</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {isLoading ? (
 <tr><td colSpan={5} className="text-center py-8 text-secondary">Loading lots...</td></tr>
 ) : lots.length === 0 ? (
 <tr><td colSpan={5} className="text-center py-8 text-secondary">No fabric lots found.</td></tr>
 ) : (
 lots.map((lot: FabricLot) => (
 <tr key={lot._id} className="hover:bg-background/50">
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="text-sm font-medium text-primary font-mono">{lot.lotNumber}</div>
 <div className="text-xs text-secondary mt-1">{lot.fabricType} {lot.gsm ? `| ${lot.gsm} GSM` : ''}</div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">{lot.supplierParty}</td>
 <td className="px-6 py-4 whitespace-nowrap text-right">
 <div className="text-sm font-bold text-primary">{lot.totalWeightKg} kg</div>
 {lot.totalRolls && <div className="text-xs text-secondary">{lot.totalRolls} rolls</div>}
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span className={`px-2 py-1 text-xs rounded-full font-medium ${lot.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
 lot.status === 'IN_PRODUCTION' ? 'bg-blue-100 text-blue-800' :
 'bg-yellow-100 text-yellow-800'
 }`}>
 {lot.status.replace('_', ' ')}
 </span>
 </td>
 {isSupervisor && (
 <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
 <div className="flex justify-end gap-3">
 <button onClick={() => openModal(lot)} className="text-blue-600 hover:text-blue-800" title="Edit">
 <Edit2 className="h-4 w-4" />
 </button>
 <button onClick={() => {
 if (window.confirm('Delete this fabric lot? This action cannot be undone.')) {
 deleteMutation.mutate(lot._id);
 }
 }} className="text-danger hover:text-red-700" title="Delete">
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </td>
 )}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {isModalOpen && (
 <FabricLotForm
 lot={editingLot}
 onClose={closeModal}
 />
 )}
 </div>
 );
};

export default FabricLotList;
