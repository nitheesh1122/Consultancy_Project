import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Users as UsersIcon, Plus, Edit2, Trash2, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ReadOnlyTable, type ColumnDef } from '../../components/ui/ReadOnlyTable';

interface Worker {
    _id: string;
    workerId: string;
    name: string;
    role: 'HELPER' | 'OPERATOR' | 'SENIOR_OPERATOR' | 'SUPERVISOR' | 'TECHNICIAN' | 'LAB_ASSISTANT';
    phone: string;
    status: 'ACTIVE' | 'BUSY' | 'ON_LEAVE' | 'INACTIVE';
    assignedMachine?: string;
    personal?: {
        dateOfBirth: string;
        gender: 'MALE' | 'FEMALE' | 'OTHER';
        bloodGroup?: string;
        address: {
            street: string;
            city: string;
            state: string;
            pincode: string;
            isLocal: boolean;
        };
        emergencyContact: {
            name: string;
            relation: string;
            phone: string;
        };
        photoUrl?: string;
    };
    employment?: {
        joiningDate: string;
        experienceYears: number;
        previousEmployer?: string;
        referralSource?: string;
        isMigrantWorker: boolean;
        nativeState?: string;
        accommodation?: 'FACTORY_HOSTEL' | 'RENTED_ROOM' | 'OWN_ARRANGEMENT';
        messFacility: boolean;
        esiNumber?: string;
        pfNumber?: string;
        uanNumber?: string;
        bankAccount?: {
            accountName: string;
            accountNumber: string;
            bankName: string;
            ifscCode: string;
        };
    };
    skills?: {
        machineTypes: string[];
        fabricSpecialization: string[];
        shadeMatching: boolean;
        chemicalHandling: boolean;
        firstAidTrained: boolean;
        languages: string[];
    };
    performance?: {
        currentSkillLevel: number;
        attendanceScore: number;
    }
}

const MACHINE_TYPES = ['WINCH', 'SOFT_FLOW', 'JET_DYEING', 'JIGGER', 'BEAM_DYEING'];
const FABRIC_TYPES = ['COTTON_JERSEY', 'COTTON_LYCRA', 'POLYESTER', 'RAYON', 'LINEN', 'FLEECE'];
const LANGUAGES = ['Tamil', 'Hindi', 'English', 'Telugu', 'Bengali'];

const HRWorkerList = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

    const initialFormState = {
        workerId: '',
        name: '',
        phone: '',
        role: 'OPERATOR',
        status: 'ACTIVE',
        personal: {
            dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString().split('T')[0],
            gender: 'MALE',
            bloodGroup: 'O+',
            address: {
                street: '',
                city: 'Erode',
                state: 'Tamil Nadu',
                pincode: '638001',
                isLocal: true
            },
            emergencyContact: {
                name: '',
                relation: 'Father',
                phone: ''
            }
        },
        employment: {
            joiningDate: new Date().toISOString().split('T')[0],
            experienceYears: 0,
            previousEmployer: '',
            referralSource: 'Direct',
            isMigrantWorker: false,
            nativeState: '',
            accommodation: 'OWN_ARRANGEMENT',
            messFacility: false,
            esiNumber: '',
            pfNumber: '',
            uanNumber: '',
            bankAccount: {
                accountName: '',
                accountNumber: '',
                bankName: 'SBI Erode',
                ifscCode: ''
            }
        },
        skills: {
            machineTypes: [],
            fabricSpecialization: [],
            shadeMatching: false,
            chemicalHandling: false,
            firstAidTrained: false,
            languages: ['Tamil']
        }
    };

    const [formData, setFormData] = useState<any>(initialFormState);

    const { data: workers = [], isLoading } = useQuery<Worker[]>({
        queryKey: ['workers'],
        queryFn: async () => {
            const res = await api.get('/workers');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (newWorker: any) => api.post('/workers', newWorker),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            closeModal();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: any }) => api.put(`/workers/${data.id}`, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            closeModal();
        }
    });

    const resetMutation = useMutation({
        mutationFn: (id: string) => api.put(`/workers/${id}`, { status: 'ACTIVE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workers'] })
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/workers/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workers'] })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingWorker) {
            updateMutation.mutate({ id: editingWorker._id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const openModal = (worker?: Worker) => {
        if (worker) {
            setEditingWorker(worker);

            // Deep copy to prevent reference mutation issues
            const baseForm = JSON.parse(JSON.stringify(initialFormState));

            setFormData({
                workerId: worker.workerId,
                name: worker.name,
                role: worker.role,
                phone: worker.phone || '',
                status: worker.status,
                personal: {
                    ...baseForm.personal,
                    ...(worker.personal || {}),
                    dateOfBirth: worker.personal?.dateOfBirth ? new Date(worker.personal.dateOfBirth).toISOString().split('T')[0] : baseForm.personal.dateOfBirth,
                },
                employment: {
                    ...baseForm.employment,
                    ...(worker.employment || {}),
                    joiningDate: worker.employment?.joiningDate ? new Date(worker.employment.joiningDate).toISOString().split('T')[0] : baseForm.employment.joiningDate,
                },
                skills: {
                    ...baseForm.skills,
                    ...(worker.skills || {})
                }
            });
        } else {
            setEditingWorker(null);
            setFormData(JSON.parse(JSON.stringify(initialFormState)));
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingWorker(null);
    };

    const handleArrayToggle = (item: string, listType: 'machineTypes' | 'fabricSpecialization' | 'languages', category: 'skills') => {
        setFormData((prev: any) => {
            const currentList = prev[category][listType];
            const isSelected = currentList.includes(item);
            return {
                ...prev,
                [category]: {
                    ...prev[category],
                    [listType]: isSelected
                        ? currentList.filter((f: string) => f !== item)
                        : [...currentList, item]
                }
            };
        });
    };

    const handleNestedChange = (category: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    const handleDeepNestedChange = (category: string, subCategory: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [subCategory]: {
                    ...prev[category][subCategory],
                    [field]: value
                }
            }
        }));
    };

    const columns: ColumnDef<Worker>[] = [
        {
            header: 'Worker',
            cell: (w) => (
                <>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {w.name}
                        {w.employment?.isMigrantWorker && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200" title="Migrant Worker">
                                M
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{w.workerId}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{w.personal?.address?.state || 'Local'}</div>
                </>
            )
        },
        {
            header: 'Role & Skills',
            cell: (w) => (
                <>
                    <div className="text-sm text-gray-900 font-medium mb-1">{w.role.replace('_', ' ')}</div>
                    <div className="flex flex-wrap gap-1">
                        {w.skills?.machineTypes?.slice(0, 3).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] uppercase font-semibold border border-indigo-100">
                                {skill.replace('_', ' ')}
                            </span>
                        ))}
                        {(w.skills?.machineTypes?.length || 0) > 3 && (
                            <span className="text-[10px] text-gray-500">+{w.skills!.machineTypes.length - 3}</span>
                        )}
                    </div>
                </>
            )
        },
        { header: 'Contact', accessorKey: 'phone' },
        {
            header: 'Status',
            cell: (w) => (
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${w.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    w.status === 'BUSY' ? 'bg-orange-100 text-orange-800' :
                        w.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                    }`}>
                    {w.status}
                </span>
            )
        }
    ];

    if (isAdmin) {
        return (
            <ReadOnlyTable
                title="Worker Master"
                description="View production line staff, skills, and availability"
                icon={<UsersIcon className="h-6 w-6 text-indigo-600" />}
                data={workers}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No workers found."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <UsersIcon className="h-6 w-6 text-indigo-600" />
                        Worker Master
                    </h2>
                    <p className="text-gray-500">Manage production line demographics, skills, and compliance data</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="h-4 w-4" /> Add Worker
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role & Skills</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading workers...</td></tr>
                        ) : workers.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No workers found.</td></tr>
                        ) : (
                            workers.map(worker => (
                                <tr key={worker._id} className={worker.status === 'INACTIVE' ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50/50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                            {worker.name}
                                            {worker.employment?.isMigrantWorker && (
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200" title="Migrant Worker">
                                                    M
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">{worker.workerId}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{worker.personal?.address?.state || 'Local'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium mb-1">{worker.role.replace('_', ' ')}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {worker.skills?.machineTypes?.slice(0, 3).map(skill => (
                                                <span key={skill} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] uppercase font-semibold border border-indigo-100">
                                                    {skill.replace('_', ' ')}
                                                </span>
                                            ))}
                                            {(worker.skills?.machineTypes?.length || 0) > 3 && (
                                                <span className="text-[10px] text-gray-500">+{worker.skills!.machineTypes.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.phone || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${worker.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            worker.status === 'BUSY' ? 'bg-orange-100 text-orange-800' :
                                                worker.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {worker.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end items-center gap-3">
                                            {worker.status === 'BUSY' && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Force unlock worker ${worker.name}?`)) {
                                                            resetMutation.mutate(worker._id);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded text-xs font-semibold uppercase tracking-wider"
                                                    title="Emergency unlock - use if worker stuck"
                                                >
                                                    <ShieldAlert className="h-3 w-3" /> Force Reset
                                                </button>
                                            )}
                                            <button onClick={() => openModal(worker)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            {worker.status !== 'INACTIVE' && (
                                                <button onClick={() => {
                                                    if (window.confirm('Are you sure you want to deactivate this worker?')) {
                                                        deleteMutation.mutate(worker._id);
                                                    }
                                                }} className="text-gray-400 hover:text-gray-600" title="Deactivate">
                                                    <Trash2 className="h-4 w-4" />
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
                                    <UsersIcon className="h-5 w-5 text-indigo-600" />
                                    {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Configure Erode textile labor context and compliances.</p>
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
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Worker ID *</label>
                                        <input
                                            required type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none uppercase font-mono"
                                            value={formData.workerId}
                                            onChange={e => setFormData({ ...formData, workerId: e.target.value.toUpperCase() })}
                                            placeholder="GTD-W-XXX"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                                        <input
                                            required type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="WhatsApp preferred"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="HELPER">Helper</option>
                                            <option value="OPERATOR">Operator</option>
                                            <option value="SENIOR_OPERATOR">Senior Operator</option>
                                            <option value="SUPERVISOR">Supervisor</option>
                                            <option value="TECHNICIAN">Technician</option>
                                            <option value="LAB_ASSISTANT">Lab Assistant</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            disabled={formData.status === 'BUSY'}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="BUSY" disabled>Busy</option>
                                            <option value="ON_LEAVE">On Leave</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: PERSONAL DETAILS */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 2: PERSONAL DETAILS</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.personal.dateOfBirth}
                                            onChange={e => handleNestedChange('personal', 'dateOfBirth', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.personal.gender}
                                            onChange={e => handleNestedChange('personal', 'gender', e.target.value)}
                                        >
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Blood Group</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.personal.bloodGroup}
                                            onChange={e => handleNestedChange('personal', 'bloodGroup', e.target.value)}
                                        >
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>

                                    {/* Address */}
                                    <div className="col-span-4 mt-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-2 border-b pb-1">Address</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="col-span-2">
                                                <input type="text" placeholder="Street" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.personal.address.street} onChange={e => handleDeepNestedChange('personal', 'address', 'street', e.target.value)} />
                                            </div>
                                            <div>
                                                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.personal.address.city} onChange={e => handleDeepNestedChange('personal', 'address', 'city', e.target.value)}>
                                                    <option value="Erode">Erode</option>
                                                    <option value="Coimbatore">Coimbatore</option>
                                                    <option value="Salem">Salem</option>
                                                    <option value="Tirupur">Tirupur</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.personal.address.state} onChange={e => handleDeepNestedChange('personal', 'address', 'state', e.target.value)}>
                                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                                    <option value="Bihar">Bihar</option>
                                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                                    <option value="Odisha">Odisha</option>
                                                    <option value="West Bengal">West Bengal</option>
                                                </select>
                                            </div>
                                            <div>
                                                <input type="text" placeholder="Pincode" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.personal.address.pincode} onChange={e => handleDeepNestedChange('personal', 'address', 'pincode', e.target.value)} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="isLocal" checked={formData.personal.address.isLocal} onChange={e => handleDeepNestedChange('personal', 'address', 'isLocal', e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                                                <label htmlFor="isLocal" className="text-sm font-medium text-gray-700">Is Local Resident?</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="col-span-4 mt-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-2 border-b pb-1">Emergency Contact</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <input type="text" placeholder="Name" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.personal.emergencyContact.name} onChange={e => handleDeepNestedChange('personal', 'emergencyContact', 'name', e.target.value)} />
                                            </div>
                                            <div>
                                                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.personal.emergencyContact.relation} onChange={e => handleDeepNestedChange('personal', 'emergencyContact', 'relation', e.target.value)}>
                                                    <option value="Father">Father</option>
                                                    <option value="Spouse">Spouse</option>
                                                    <option value="Brother">Brother</option>
                                                    <option value="Mother">Mother</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <input type="tel" placeholder="Phone" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.personal.emergencyContact.phone} onChange={e => handleDeepNestedChange('personal', 'emergencyContact', 'phone', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: EMPLOYMENT & COMPLIANCE */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 3: EMPLOYMENT (Erode Context)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Joining Date</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.employment.joiningDate}
                                            onChange={e => handleNestedChange('employment', 'joiningDate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Prior Experience (Years)</label>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.employment.अनुभवExperienceYears}
                                            onChange={e => handleNestedChange('employment', 'experienceYears', Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Previous Employer</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.employment.previousEmployer}
                                            onChange={e => handleNestedChange('employment', 'previousEmployer', e.target.value)}
                                            placeholder="e.g Premier Dyeing"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Referred By</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.employment.referralSource}
                                            onChange={e => handleNestedChange('employment', 'referralSource', e.target.value)}
                                        />
                                    </div>

                                    {/* Migrant worker details */}
                                    <div className="col-span-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <input type="checkbox" id="isMigrantWorker" checked={formData.employment.isMigrantWorker} onChange={e => handleNestedChange('employment', 'isMigrantWorker', e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                                            <label htmlFor="isMigrantWorker" className="text-sm font-semibold text-gray-800">Migrant Worker (Non-Tamil Nadu native)</label>
                                        </div>
                                        {formData.employment.isMigrantWorker && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Native State</label>
                                                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        value={formData.employment.nativeState} onChange={e => handleNestedChange('employment', 'nativeState', e.target.value)}>
                                                        <option value="Bihar">Bihar</option>
                                                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                                                        <option value="Odisha">Odisha</option>
                                                        <option value="West Bengal">West Bengal</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Accommodation</label>
                                                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        value={formData.employment.accommodation} onChange={e => handleNestedChange('employment', 'accommodation', e.target.value)}>
                                                        <option value="FACTORY_HOSTEL">Factory Hostel</option>
                                                        <option value="RENTED_ROOM">Rented Room</option>
                                                        <option value="OWN_ARRANGEMENT">Own Arrangement</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2 mt-6">
                                                    <input type="checkbox" id="messFacility" checked={formData.employment.messFacility} onChange={e => handleNestedChange('employment', 'messFacility', e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                                                    <label htmlFor="messFacility" className="text-sm font-medium text-gray-700">Factory Provides Meals (Mess)</label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Compliance */}
                                    <div className="col-span-4 mt-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-2 border-b pb-1">Compliance & Bank (Mandatory for &gt;10 workers)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <input type="text" placeholder="ESI Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.employment.esiNumber} onChange={e => handleNestedChange('employment', 'esiNumber', e.target.value)} />
                                            </div>
                                            <div>
                                                <input type="text" placeholder="PF Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.employment.pfNumber} onChange={e => handleNestedChange('employment', 'pfNumber', e.target.value)} />
                                            </div>
                                            <div>
                                                <input type="text" placeholder="UAN Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.employment.uanNumber} onChange={e => handleNestedChange('employment', 'uanNumber', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <div>
                                                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.employment.bankAccount.bankName} onChange={e => handleDeepNestedChange('employment', 'bankAccount', 'bankName', e.target.value)}>
                                                    <option value="SBI Erode">SBI Erode</option>
                                                    <option value="Canara Bank">Canara Bank</option>
                                                    <option value="IOB">IOB</option>
                                                    <option value="Karur Vysya">Karur Vysya</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <input type="text" placeholder="Account Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.employment.bankAccount.accountNumber} onChange={e => handleDeepNestedChange('employment', 'bankAccount', 'accountNumber', e.target.value)} />
                                            </div>
                                            <div>
                                                <input type="text" placeholder="IFSC Code" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={formData.employment.bankAccount.ifscCode} onChange={e => handleDeepNestedChange('employment', 'bankAccount', 'ifscCode', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 4: SKILLS & CERTIFICATIONS */}
                            <section>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">SECTION 4: SKILLS & CERTIFICATIONS (Textile-Specific)</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-2">Machine Types Operated</label>
                                        <div className="flex flex-wrap gap-2">
                                            {MACHINE_TYPES.map(machine => (
                                                <label key={machine} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.skills.machineTypes.includes(machine) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                                    <input type="checkbox" className="hidden" checked={formData.skills.machineTypes.includes(machine)} onChange={() => handleArrayToggle(machine, 'machineTypes', 'skills')} />
                                                    {machine.replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-2">Fabric Specializations</label>
                                        <div className="flex flex-wrap gap-2">
                                            {FABRIC_TYPES.map(fabric => (
                                                <label key={fabric} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.skills.fabricSpecialization.includes(fabric) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                                    <input type="checkbox" className="hidden" checked={formData.skills.fabricSpecialization.includes(fabric)} onChange={() => handleArrayToggle(fabric, 'fabricSpecialization', 'skills')} />
                                                    {fabric.replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="shadeMatching" checked={formData.skills.shadeMatching} onChange={e => handleNestedChange('skills', 'shadeMatching', e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                                            <label htmlFor="shadeMatching" className="text-sm font-medium text-gray-700">Shade Matching (Approves lab dips)</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="chemicalHandling" checked={formData.skills.chemicalHandling} onChange={e => handleNestedChange('skills', 'chemicalHandling', e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                                            <label htmlFor="chemicalHandling" className="text-sm font-medium text-gray-700">Chemical Handling (Caustic, acids)</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="firstAidTrained" checked={formData.skills.firstAidTrained} onChange={e => handleNestedChange('skills', 'firstAidTrained', e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                                            <label htmlFor="firstAidTrained" className="text-sm font-medium text-gray-700">First Aid Trained</label>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-xs font-medium text-red-600 mb-2">Languages Known (Critical for migrant worker management)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {LANGUAGES.map(lang => (
                                                <label key={lang} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.skills.languages.includes(lang) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                                    <input type="checkbox" className="hidden" checked={formData.skills.languages.includes(lang)} onChange={() => handleArrayToggle(lang, 'languages', 'skills')} />
                                                    {lang}
                                                </label>
                                            ))}
                                        </div>
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
                                    {editingWorker ? 'Save Changes' : 'Save Worker'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRWorkerList;
