import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Factory, Plus, Edit2, Trash2, Power, PowerOff, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ReadOnlyTable, type ColumnDef } from '../../components/ui/ReadOnlyTable';

interface Machine {
    _id: string;
    machineId: string;
    name: string;
    type: 'WINCH' | 'SOFT_FLOW' | 'JET_DYEING' | 'JIGGER' | 'HT_HP' | 'BEAM_DYEING';
    capacityKg: number;
    specifications?: {
        maxTemperatureC: number;
        maxPressure: number;
        liquorRatio: string;
        heatingSource: 'THERMIC_FLUID' | 'DIRECT_STEAM' | 'ELECTRIC' | 'GAS';
        waterRecycling: boolean;
        powerBackup: boolean;
    };
    operation?: {
        shiftCapacity: number;
        avgBatchTimeHours: number;
        maintenanceCycle: number;
        preferredFabrics: string[];
        excludedFabrics: string[];
    };
    financial?: {
        installationDate: string;
        purchaseCost: number;
        supplierName: string;
        warrantyExpiry: string;
        amcProvider?: string;
        amcExpiry?: string;
    };
    infrastructure?: {
        location: string;
        powerConnection: 'THREE_PHASE' | 'SINGLE_PHASE';
        powerRatingKw: number;
        waterLineSize: string;
        steamConnection: boolean;
        effluentOutlet: string;
    };
    status: 'ACTIVE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
    lastMaintenanceDate?: string;
}

const FABRIC_OPTIONS = ['COTTON_JERSEY', 'POLYESTER', 'RAYON', 'WOOL', 'SILK', 'HEAVY_DENIM'];

const MachineMaster = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

    const initialFormState = {
        machineId: '',
        name: '',
        type: 'WINCH',
        capacityKg: 500,
        specifications: {
            maxTemperatureC: 120,
            maxPressure: 0,
            liquorRatio: '1:10',
            heatingSource: 'THERMIC_FLUID',
            waterRecycling: true,
            powerBackup: true
        },
        operation: {
            shiftCapacity: 2,
            avgBatchTimeHours: 5,
            maintenanceCycle: 30,
            preferredFabrics: ['COTTON_JERSEY', 'POLYESTER', 'RAYON'],
            excludedFabrics: ['WOOL', 'SILK', 'HEAVY_DENIM']
        },
        financial: {
            installationDate: new Date().toISOString().split('T')[0],
            purchaseCost: 850000,
            supplierName: 'Thirumalai Engineering',
            warrantyExpiry: new Date().toISOString().split('T')[0],
            amcProvider: 'Sclavos India',
            amcExpiry: new Date().toISOString().split('T')[0]
        },
        infrastructure: {
            location: 'Bay A - Line 1',
            powerConnection: 'THREE_PHASE',
            powerRatingKw: 25,
            waterLineSize: '2 inch',
            steamConnection: true,
            effluentOutlet: 'Common Drain'
        },
        status: 'ACTIVE'
    };

    const [formData, setFormData] = useState<any>(initialFormState);

    const { data: machines = [], isLoading } = useQuery<Machine[]>({
        queryKey: ['machines'],
        queryFn: async () => {
            const res = await api.get('/machines');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (newMachine: any) => api.post('/machines', newMachine),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            closeModal();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: any }) => api.put(`/machines/${data.id}`, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            closeModal();
        }
    });

    const retireMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/machines/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMachine) {
            updateMutation.mutate({ id: editingMachine._id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const openModal = (machine?: Machine) => {
        if (machine) {
            setEditingMachine(machine);
            setFormData({
                machineId: machine.machineId,
                name: machine.name,
                type: machine.type,
                capacityKg: machine.capacityKg,
                specifications: machine.specifications || initialFormState.specifications,
                operation: machine.operation || initialFormState.operation,
                financial: {
                    ...initialFormState.financial,
                    ...machine.financial,
                    installationDate: machine.financial?.installationDate ? new Date(machine.financial.installationDate).toISOString().split('T')[0] : initialFormState.financial.installationDate,
                    warrantyExpiry: machine.financial?.warrantyExpiry ? new Date(machine.financial.warrantyExpiry).toISOString().split('T')[0] : initialFormState.financial.warrantyExpiry,
                    amcExpiry: machine.financial?.amcExpiry ? new Date(machine.financial.amcExpiry).toISOString().split('T')[0] : initialFormState.financial.amcExpiry,
                },
                infrastructure: machine.infrastructure || initialFormState.infrastructure,
                status: machine.status
            });
        } else {
            setEditingMachine(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMachine(null);
    };

    const handleFabricToggle = (fabric: string, listType: 'preferredFabrics' | 'excludedFabrics') => {
        setFormData((prev: any) => {
            const currentList = prev.operation[listType];
            const isSelected = currentList.includes(fabric);
            return {
                ...prev,
                operation: {
                    ...prev.operation,
                    [listType]: isSelected
                        ? currentList.filter((f: string) => f !== fabric)
                        : [...currentList, fabric]
                }
            };
        });
    };

    const columns: ColumnDef<Machine>[] = [
        { header: 'Machine ID', accessorKey: 'machineId' },
        {
            header: 'Name & Type',
            cell: (m) => (
                <>
                    <div className="text-sm text-gray-900 font-semibold">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.type.replace('_', ' ')}</div>
                </>
            )
        },
        {
            header: 'Capacity & Location',
            cell: (m) => (
                <>
                    <div className="text-sm text-gray-900">{m.capacityKg} kg</div>
                    <div className="text-xs text-gray-500">{m.infrastructure?.location || 'N/A'}</div>
                </>
            )
        },
        {
            header: 'Status',
            cell: (m) => (
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    m.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                    {m.status}
                </span>
            )
        }
    ];

    if (isAdmin) {
        return (
            <ReadOnlyTable
                title="Machine Master"
                description="View dyeing equipment, capacities, and technical specs"
                icon={<Factory className="h-6 w-6 text-indigo-600" />}
                data={machines}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No machines found."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Factory className="h-6 w-6 text-indigo-600" />
                        Machine Master
                    </h2>
                    <p className="text-gray-500">Manage dyeing equipment, capacities, and technical specs</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="h-4 w-4" /> Add Machine
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name & Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity & Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading machines...</td></tr>
                        ) : machines.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No machines found.</td></tr>
                        ) : (
                            machines.map(machine => (
                                <tr key={machine._id} className={machine.status === 'RETIRED' ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50/50'}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{machine.machineId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-semibold">{machine.name}</div>
                                        <div className="text-xs text-gray-500">{machine.type.replace('_', ' ')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{machine.capacityKg} kg</div>
                                        <div className="text-xs text-gray-500">{machine.infrastructure?.location || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${machine.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            machine.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {machine.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => openModal(machine)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            {machine.status !== 'RETIRED' && (
                                                <button onClick={() => {
                                                    if (window.confirm('Are you sure you want to retire this machine?')) {
                                                        retireMutation.mutate(machine._id);
                                                    }
                                                }} className="text-red-500 hover:text-red-700" title="Retire">
                                                    <PowerOff className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex py-10 justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl min-h-fit self-start animate-fade-in my-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl z-10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Factory className="h-5 w-5 text-indigo-600" />
                                    {editingMachine ? 'Edit Machine' : 'Add New Machine'}
                                </h3>

                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">

                            {/* SECTION 1: BASIC INFORMATION */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 1: BASIC INFORMATION</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Machine ID (Auto/Manual) *</label>
                                        <input
                                            required type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.machineId}
                                            onChange={e => setFormData({ ...formData, machineId: e.target.value })}
                                            placeholder="GTD-M-XXX"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                                        <input
                                            required type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Capacity (Kg) *</label>
                                        <input
                                            required type="number" min="1"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.capacityKg}
                                            onChange={e => setFormData({ ...formData, capacityKg: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="WINCH">Winch Dyeing</option>
                                            <option value="SOFT_FLOW">Soft Flow</option>
                                            <option value="JET_DYEING">Jet Dyeing (HT-HP)</option>
                                            <option value="JIGGER">Jigger</option>
                                            <option value="BEAM_DYEING">Beam Dyeing</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="IN_USE" disabled>In Use</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                            <option value="RETIRED">Retired</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: TECHNICAL SPECIFICATIONS */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 2: TECHNICAL SPECIFICATIONS (Erode Standards)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Max Temp (°C)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.specifications.maxTemperatureC}
                                            onChange={e => setFormData({ ...formData, specifications: { ...formData.specifications, maxTemperatureC: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Max Pressure (kg/cm²)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.specifications.maxPressure}
                                            onChange={e => setFormData({ ...formData, specifications: { ...formData.specifications, maxPressure: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Liquor Ratio (Water:Fabric)</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.specifications.liquorRatio}
                                            onChange={e => setFormData({ ...formData, specifications: { ...formData.specifications, liquorRatio: e.target.value } })}
                                        >
                                            <option value="1:6">1:6</option>
                                            <option value="1:8">1:8</option>
                                            <option value="1:10">1:10</option>
                                            <option value="1:12">1:12</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Heating Source</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.specifications.heatingSource}
                                            onChange={e => setFormData({ ...formData, specifications: { ...formData.specifications, heatingSource: e.target.value } })}
                                        >
                                            <option value="THERMIC_FLUID">Thermic Fluid</option>
                                            <option value="DIRECT_STEAM">Direct Steam</option>
                                            <option value="ELECTRIC">Electric</option>
                                            <option value="GAS">Gas</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id="waterRecycling"
                                            checked={formData.specifications.waterRecycling}
                                            onChange={e => setFormData({ ...formData, specifications: { ...formData.specifications, waterRecycling: e.target.checked } })}
                                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                                        />
                                        <label htmlFor="waterRecycling" className="text-sm font-medium text-gray-700">Water Recycling Included (TNPCB Compliance)</label>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id="powerBackup"
                                            checked={formData.specifications.powerBackup}
                                            onChange={e => setFormData({ ...formData, specifications: { ...formData.specifications, powerBackup: e.target.checked } })}
                                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                                        />
                                        <label htmlFor="powerBackup" className="text-sm font-medium text-gray-700">Power Backup (UPS/Generator Line Connected)</label>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: OPERATIONAL PROFILE */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 3: OPERATIONAL PROFILE</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Batches per Shift</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.operation.shiftCapacity}
                                            onChange={e => setFormData({ ...formData, operation: { ...formData.operation, shiftCapacity: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Avg Batch Time (Hours)</label>
                                        <input
                                            type="number" step="0.5"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.operation.avgBatchTimeHours}
                                            onChange={e => setFormData({ ...formData, operation: { ...formData.operation, avgBatchTimeHours: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Maint. Cycle (Days)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.operation.maintenanceCycle}
                                            onChange={e => setFormData({ ...formData, operation: { ...formData.operation, maintenanceCycle: Number(e.target.value) } })}
                                        />
                                    </div>

                                    <div className="col-span-4 mt-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-2">Preferred Fabrics (Select multiple)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {FABRIC_OPTIONS.map(fabric => (
                                                <label key={`pref-${fabric}`} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.operation.preferredFabrics.includes(fabric) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.operation.preferredFabrics.includes(fabric)}
                                                        onChange={() => handleFabricToggle(fabric, 'preferredFabrics')}
                                                    />
                                                    {fabric.replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-span-4 mt-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-2">Unsuitable / Excluded Fabrics (Select multiple)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {FABRIC_OPTIONS.map(fabric => (
                                                <label key={`excl-${fabric}`} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.operation.excludedFabrics.includes(fabric) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.operation.excludedFabrics.includes(fabric)}
                                                        onChange={() => handleFabricToggle(fabric, 'excludedFabrics')}
                                                    />
                                                    {fabric.replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 4: FINANCIAL & COMPLIANCE */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 4: FINANCIAL & COMPLIANCE</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Installation Date</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.financial.installationDate}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, installationDate: e.target.value } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Cost (INR)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.financial.purchaseCost}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, purchaseCost: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.financial.supplierName}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, supplierName: e.target.value } })}
                                        >
                                            <option value="Thirumalai Engineering">Thirumalai Engineering</option>
                                            <option value="Sclavos">Sclavos</option>
                                            <option value="Fongs">Fongs</option>
                                            <option value="Atul Machine Tools">Atul Machine Tools</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Warranty Expiry Date</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.financial.warrantyExpiry}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, warrantyExpiry: e.target.value } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">AMC Provider</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.financial.amcProvider}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, amcProvider: e.target.value } })}
                                            placeholder="e.g Sclavos India"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">AMC Valid Until</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.financial.amcExpiry}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, amcExpiry: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 5: INFRASTRUCTURE */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 5: INFRASTRUCTURE (Erode Factory Layout)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.infrastructure.location}
                                            onChange={e => setFormData({ ...formData, infrastructure: { ...formData.infrastructure, location: e.target.value } })}
                                        >
                                            <option value="Bay A - Line 1">Bay A - Line 1</option>
                                            <option value="Bay A - Line 2">Bay A - Line 2</option>
                                            <option value="Bay B">Bay B</option>
                                            <option value="Near Boiler">Near Boiler</option>
                                            <option value="ETP Area">ETP Area</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Power Connection</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.infrastructure.powerConnection}
                                            onChange={e => setFormData({ ...formData, infrastructure: { ...formData.infrastructure, powerConnection: e.target.value } })}
                                        >
                                            <option value="THREE_PHASE">3-Phase</option>
                                            <option value="SINGLE_PHASE">Single Phase</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Power Rating (kW)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.infrastructure.powerRatingKw}
                                            onChange={e => setFormData({ ...formData, infrastructure: { ...formData.infrastructure, powerRatingKw: Number(e.target.value) } })}
                                            placeholder="kW"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Water Line Size</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.infrastructure.waterLineSize}
                                            onChange={e => setFormData({ ...formData, infrastructure: { ...formData.infrastructure, waterLineSize: e.target.value } })}
                                        >
                                            <option value="1 inch">1 inch</option>
                                            <option value="2 inch">2 inch</option>
                                            <option value="3 inch">3 inch</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Effluent Outlet</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.infrastructure.effluentOutlet}
                                            onChange={e => setFormData({ ...formData, infrastructure: { ...formData.infrastructure, effluentOutlet: e.target.value } })}
                                        >
                                            <option value="Common Drain">Common Drain</option>
                                            <option value="ETP Line 1">ETP Line 1</option>
                                            <option value="ETP Line 2">ETP Line 2</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2 flex items-center gap-2 mt-6">
                                        <input
                                            type="checkbox"
                                            id="steamConnection"
                                            checked={formData.infrastructure.steamConnection}
                                            onChange={e => setFormData({ ...formData, infrastructure: { ...formData.infrastructure, steamConnection: e.target.checked } })}
                                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                                        />
                                        <label htmlFor="steamConnection" className="text-sm font-medium text-gray-700">Steam Connected (Required for winch heating)</label>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] py-4">
                                <button type="button" onClick={closeModal} className="px-6 py-2.5 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="px-6 py-2.5 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {editingMachine ? 'Save Changes' : 'Save Machine'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachineMaster;
