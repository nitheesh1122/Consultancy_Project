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
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <CalendarClock className="h-6 w-6 text-indigo-600" />
                            Schedule New Batch
                        </h2>
                        <p className="text-gray-500">Plan production for a specific machine and shift</p>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scheduling Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Schedule Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Machine</label>
                            <select
                                required
                                value={formData.machineId}
                                onChange={e => setFormData({ ...formData, machineId: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="" disabled>Select a machine...</option>
                                {machines.map((m: any) => (
                                    <option key={m._id} value={m._id}>{m.name} ({m.capacityKg}kg)</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    required type="date"
                                    value={formData.scheduledDate}
                                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]} // cannot schedule in past easily
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                <select
                                    value={formData.shift}
                                    onChange={e => setFormData({ ...formData, shift: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                            <h3 className="font-semibold text-gray-900">Material / Lot Info</h3>
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Select a Pending Lot to Auto-fill</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Pending Fabric Lot</label>
                            <select
                                value={formData.selectedLotId}
                                onChange={handleLotSelect}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50 mb-2 font-medium text-indigo-900"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                                <input
                                    required type="text" placeholder="e.g. L-12345"
                                    value={formData.lotNumber}
                                    onChange={e => setFormData({ ...formData, lotNumber: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                    readOnly={!!formData.selectedLotId}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Party</label>
                                <input
                                    required type="text"
                                    value={formData.supplierParty}
                                    onChange={e => setFormData({ ...formData, supplierParty: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                    readOnly={!!formData.selectedLotId}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
                                <input
                                    required type="text" placeholder="e.g. 100% Cotton"
                                    value={formData.fabricType}
                                    onChange={e => setFormData({ ...formData, fabricType: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                    readOnly={!!formData.selectedLotId}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GSM</label>
                                <input
                                    required type="text" placeholder="e.g. 180"
                                    value={formData.gsm}
                                    onChange={e => setFormData({ ...formData, gsm: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                    readOnly={!!formData.selectedLotId}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Input (Kg)</label>
                                <input
                                    required type="number" min="1" step="0.1"
                                    value={formData.inputKg}
                                    onChange={e => setFormData({ ...formData, inputKg: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rolls</label>
                                <input
                                    required type="number" min="1"
                                    value={formData.rolls}
                                    onChange={e => setFormData({ ...formData, rolls: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shade Target</label>
                                <input
                                    required type="text" placeholder="Navy Blue"
                                    value={formData.shadeTarget}
                                    onChange={e => setFormData({ ...formData, shadeTarget: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createBatchMutation.isPending || machinesLoading}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {createBatchMutation.isPending ? 'Scheduling...' : 'Schedule Batch'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScheduleBatch;
