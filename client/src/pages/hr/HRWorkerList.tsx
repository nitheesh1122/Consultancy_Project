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
                    <div className="text-sm font-medium text-primary flex items-center gap-2">
                        {w.name}
                        {w.employment?.isMigrantWorker && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200" title="Migrant Worker">
                                M
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-secondary font-mono">{w.workerId}</div>
                    <div className="text-[10px] text-muted mt-0.5">{w.personal?.address?.state || 'Local'}</div>
                </>
            )
        },
        {
            header: 'Role & Skills',
            cell: (w) => (
                <>
                    <div className="text-sm text-primary font-medium mb-1">{w.role.replace('_', ' ')}</div>
                    <div className="flex flex-wrap gap-1">
                        {w.skills?.machineTypes?.slice(0, 3).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] uppercase font-semibold border border-primary/20">
                                {skill.replace('_', ' ')}
                            </span>
                        ))}
                        {(w.skills?.machineTypes?.length || 0) > 3 && (
                            <span className="text-[10px] text-secondary">+{w.skills!.machineTypes.length - 3}</span>
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
                            'bg-elevated text-secondary'
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
                icon={<UsersIcon className="h-6 w-6 text-primary" />}
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
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <UsersIcon className="h-6 w-6 text-primary" />
                        Worker Master
                    </h2>
                    <p className="text-secondary">Manage production line demographics, skills, and compliance data</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition"
                >
                    <Plus className="h-4 w-4" /> Add Worker
                </button>
            </div>

            <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-elevated border-b border-subtle">
                        <tr>
                            <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Worker</th>
                            <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Role & Skills</th>
                            <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3.5 text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-secondary">Loading workers...</td></tr>
                        ) : workers.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-secondary">No workers found.</td></tr>
                        ) : (
                            workers.map(worker => (
                                <tr key={worker._id} className={worker.status === 'INACTIVE' ? 'bg-canvas opacity-50' : 'hover:bg-canvas/60 transition-colors'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold font-heading text-primary flex items-center gap-2">
                                            {worker.name}
                                            {worker.employment?.isMigrantWorker && (
                                                <span className="px-1.5 py-0.5 bg-status-info/10 text-status-info text-[10px] rounded uppercase font-bold border border-status-info/30 tracking-wider" title="Migrant Worker">
                                                    M
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-secondary font-mono mt-0.5 tracking-tight">{worker.workerId}</div>
                                        <div className="text-[10px] text-muted mt-1 uppercase tracking-wider font-semibold">{worker.personal?.address?.state || 'Local'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-primary font-bold mb-2 uppercase tracking-wide">{worker.role.replace('_', ' ')}</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {worker.skills?.machineTypes?.slice(0, 3).map(skill => (
                                                <span key={skill} className="px-1.5 py-0.5 bg-elevated text-secondary rounded shadow-sm text-[10px] uppercase font-bold border border-subtle">
                                                    {skill.replace('_', ' ')}
                                                </span>
                                            ))}
                                            {(worker.skills?.machineTypes?.length || 0) > 3 && (
                                                <span className="text-[10px] text-muted font-bold ml-1">+{worker.skills!.machineTypes.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-mono">{worker.phone || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-sm font-bold border ${worker.status === 'ACTIVE' ? 'bg-status-success/10 text-status-success border-status-success/30' :
                                            worker.status === 'BUSY' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                                                worker.status === 'ON_LEAVE' ? 'bg-status-info/10 text-status-info border-status-info/30' :
                                                    'bg-elevated text-secondary border-subtle'
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
                                                    className="flex items-center gap-1 text-status-danger hover:text-red-800 px-2 py-1 bg-status-danger/10 hover:bg-red-100 rounded text-xs font-semibold uppercase tracking-wider"
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
                                                }} className="text-muted hover:text-secondary" title="Deactivate">
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
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex py-10 justify-center z-50 overflow-y-auto animate-fade-in">
                    <div className="bg-card rounded-xl shadow-2xl w-full max-w-4xl min-h-fit self-start my-auto border border-subtle relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-brand-primary rounded-full opacity-5 blur-3xl pointer-events-none"></div>
                        <div className="sticky top-0 bg-card/90 backdrop-blur-md px-6 py-4 border-b border-subtle flex justify-between items-center z-10">
                            <div>
                                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5 text-primary" />
                                    {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                                </h3>
                                <p className="text-xs text-secondary mt-1">Configure Erode textile labor context and compliances.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="text-muted hover:text-secondary bg-canvas hover:bg-elevated p-2 rounded-full transition-colors" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">

                            {/* SECTION 1: BASIC INFORMATION */}
                            <section>
                                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b pb-2">SECTION 1: BASIC INFORMATION</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="worker-id">Worker ID *</label>
                                        <input
                                            id="worker-id"
                                            required type="text"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none uppercase font-mono"
                                            value={formData.workerId}
                                            onChange={e => setFormData({ ...formData, workerId: e.target.value.toUpperCase() })}
                                            placeholder="GTD-W-XXX"
                                            aria-label="Worker ID"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="worker-name">Full Name *</label>
                                        <input
                                            id="worker-name"
                                            required type="text"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            aria-label="Full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="worker-phone">Phone</label>
                                        <input
                                            id="worker-phone"
                                            type="tel"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="WhatsApp preferred"
                                            aria-label="Phone number"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="worker-role">Role *</label>
                                        <select
                                            id="worker-role"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            aria-label="Worker role"
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
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="worker-status">Status</label>
                                        <select
                                            id="worker-status"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            disabled={formData.status === 'BUSY'}
                                            aria-label="Worker status"
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
                                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b pb-2">SECTION 2: PERSONAL DETAILS</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="dob">Date of Birth</label>
                                        <input
                                            id="dob"
                                            type="date"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.personal.dateOfBirth}
                                            onChange={e => handleNestedChange('personal', 'dateOfBirth', e.target.value)}
                                            aria-label="Date of birth"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="gender">Gender</label>
                                        <select
                                            id="gender"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.personal.gender}
                                            onChange={e => handleNestedChange('personal', 'gender', e.target.value)}
                                            aria-label="Gender"
                                        >
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="blood-group">Blood Group</label>
                                        <select
                                            id="blood-group"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.personal.bloodGroup}
                                            onChange={e => handleNestedChange('personal', 'bloodGroup', e.target.value)}
                                            aria-label="Blood group"
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
                                        <label className="block text-xs font-medium text-primary mb-2 border-b pb-1">Address</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="col-span-2">
                                                <input type="text" placeholder="Street" className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.personal.address.street} onChange={e => handleDeepNestedChange('personal', 'address', 'street', e.target.value)} aria-label="Street address" />
                                            </div>
                                            <div>
                                                <select className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.personal.address.city} onChange={e => handleDeepNestedChange('personal', 'address', 'city', e.target.value)} aria-label="City">
                                                    <option value="Erode">Erode</option>
                                                    <option value="Coimbatore">Coimbatore</option>
                                                    <option value="Salem">Salem</option>
                                                    <option value="Tirupur">Tirupur</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <select className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.personal.address.state} onChange={e => handleDeepNestedChange('personal', 'address', 'state', e.target.value)} aria-label="State">
                                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                                    <option value="Bihar">Bihar</option>
                                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                                    <option value="Odisha">Odisha</option>
                                                    <option value="West Bengal">West Bengal</option>
                                                </select>
                                            </div>
                                            <div>
                                                <input type="text" placeholder="Pincode" className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.personal.address.pincode} onChange={e => handleDeepNestedChange('personal', 'address', 'pincode', e.target.value)} aria-label="Pincode" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="isLocal" checked={formData.personal.address.isLocal} onChange={e => handleDeepNestedChange('personal', 'address', 'isLocal', e.target.checked)} className="h-4 w-4 text-primary rounded border-subtle" />
                                                <label htmlFor="isLocal" className="text-sm font-medium text-primary">Is Local Resident?</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="col-span-4 mt-2">
                                        <label className="block text-xs font-medium text-primary mb-2 border-b pb-1">Emergency Contact</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <input type="text" placeholder="Name" className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.personal.emergencyContact.name} onChange={e => handleDeepNestedChange('personal', 'emergencyContact', 'name', e.target.value)} aria-label="Emergency contact name" />
                                            </div>
                                            <div>
                                                <select className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.personal.emergencyContact.relation} onChange={e => handleDeepNestedChange('personal', 'emergencyContact', 'relation', e.target.value)} aria-label="Emergency contact relation">
                                                    <option value="Father">Father</option>
                                                    <option value="Spouse">Spouse</option>
                                                    <option value="Brother">Brother</option>
                                                    <option value="Mother">Mother</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <input type="tel" placeholder="Phone" className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.personal.emergencyContact.phone} onChange={e => handleDeepNestedChange('personal', 'emergencyContact', 'phone', e.target.value)} aria-label="Emergency contact phone" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: EMPLOYMENT & COMPLIANCE */}
                            <section>
                                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b pb-2">SECTION 3: EMPLOYMENT (Erode Context)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="joining-date">Joining Date</label>
                                        <input
                                            id="joining-date"
                                            type="date"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.employment.joiningDate}
                                            onChange={e => handleNestedChange('employment', 'joiningDate', e.target.value)}
                                            aria-label="Joining date"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="experience-years">Prior Experience (Years)</label>
                                        <input
                                            id="experience-years"
                                            type="number"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.employment.अनुभवExperienceYears}
                                            onChange={e => handleNestedChange('employment', 'experienceYears', Number(e.target.value))}
                                            aria-label="Prior experience in years"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1">Previous Employer</label>
                                        <input
                                            type="text"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.employment.previousEmployer}
                                            onChange={e => handleNestedChange('employment', 'previousEmployer', e.target.value)}
                                            placeholder="e.g Premier Dyeing"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-1" htmlFor="referred-by">Referred By</label>
                                        <input
                                            id="referred-by"
                                            type="text"
                                            className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={formData.employment.referralSource}
                                            onChange={e => handleNestedChange('employment', 'referralSource', e.target.value)}
                                            placeholder="Referral source"
                                            aria-label="Referred by"
                                        />
                                    </div>

                                    {/* Migrant worker details */}
                                    <div className="col-span-4 bg-canvas p-4 rounded-lg border border-subtle mt-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <input type="checkbox" id="isMigrantWorker" checked={formData.employment.isMigrantWorker} onChange={e => handleNestedChange('employment', 'isMigrantWorker', e.target.checked)} className="h-4 w-4 text-primary rounded border-subtle" />
                                            <label htmlFor="isMigrantWorker" className="text-sm font-semibold text-primary">Migrant Worker (Non-Tamil Nadu native)</label>
                                        </div>
                                        {formData.employment.isMigrantWorker && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-primary mb-1">Native State</label>
                                                    <select className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                        value={formData.employment.nativeState} onChange={e => handleNestedChange('employment', 'nativeState', e.target.value)} aria-label="Native state">
                                                        <option value="Bihar">Bihar</option>
                                                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                                                        <option value="Odisha">Odisha</option>
                                                        <option value="West Bengal">West Bengal</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-primary mb-1">Accommodation</label>
                                                    <select className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                        value={formData.employment.accommodation} onChange={e => handleNestedChange('employment', 'accommodation', e.target.value)} aria-label="Accommodation">
                                                        <option value="FACTORY_HOSTEL">Factory Hostel</option>
                                                        <option value="RENTED_ROOM">Rented Room</option>
                                                        <option value="OWN_ARRANGEMENT">Own Arrangement</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2 mt-6">
                                                    <input type="checkbox" id="messFacility" checked={formData.employment.messFacility} onChange={e => handleNestedChange('employment', 'messFacility', e.target.checked)} className="h-4 w-4 text-primary rounded border-subtle" />
                                                    <label htmlFor="messFacility" className="text-sm font-medium text-primary">Factory Provides Meals (Mess)</label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Compliance */}
                                    <div className="col-span-4 mt-2">
                                        <label className="block text-xs font-medium text-primary mb-2 border-b pb-1">Compliance & Bank (Mandatory for &gt;10 workers)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <input type="text" placeholder="ESI Number" className="w-full border border-subtle rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.employment.esiNumber} onChange={e => handleNestedChange('employment', 'esiNumber', e.target.value)} aria-label="ESI number" />
                                            </div>
                                            <div>
                                                <input type="text" placeholder="PF Number" className="w-full border border-subtle rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.employment.pfNumber} onChange={e => handleNestedChange('employment', 'pfNumber', e.target.value)} aria-label="PF number" />
                                            </div>
                                            <div>
                                                <input type="text" placeholder="UAN Number" className="w-full border border-subtle rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.employment.uanNumber} onChange={e => handleNestedChange('employment', 'uanNumber', e.target.value)} aria-label="UAN number" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <div>
                                                <select className="w-full border border-subtle rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.employment.bankAccount.bankName} onChange={e => handleDeepNestedChange('employment', 'bankAccount', 'bankName', e.target.value)} aria-label="Bank name">
                                                    <option value="SBI Erode">SBI Erode</option>
                                                    <option value="Canara Bank">Canara Bank</option>
                                                    <option value="IOB">IOB</option>
                                                    <option value="Karur Vysya">Karur Vysya</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <input type="text" placeholder="Account Number" className="w-full border border-subtle rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.employment.bankAccount.accountNumber} onChange={e => handleDeepNestedChange('employment', 'bankAccount', 'accountNumber', e.target.value)} aria-label="Bank account number" />
                                            </div>
                                            <div>
                                                <input type="text" placeholder="IFSC Code" className="w-full border border-subtle rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                                                    value={formData.employment.bankAccount.ifscCode} onChange={e => handleDeepNestedChange('employment', 'bankAccount', 'ifscCode', e.target.value)} aria-label="IFSC code" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 4: SKILLS & CERTIFICATIONS */}
                            <section>
                                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b pb-2">SECTION 4: SKILLS & CERTIFICATIONS (Textile-Specific)</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-2">Machine Types Operated</label>
                                        <div className="flex flex-wrap gap-2">
                                            {MACHINE_TYPES.map(machine => (
                                                <label key={machine} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.skills.machineTypes.includes(machine) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-canvas border-subtle text-secondary hover:bg-elevated'}`}>
                                                    <input type="checkbox" className="hidden" checked={formData.skills.machineTypes.includes(machine)} onChange={() => handleArrayToggle(machine, 'machineTypes', 'skills')} />
                                                    {machine.replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-primary mb-2">Fabric Specializations</label>
                                        <div className="flex flex-wrap gap-2">
                                            {FABRIC_TYPES.map(fabric => (
                                                <label key={fabric} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.skills.fabricSpecialization.includes(fabric) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-canvas border-subtle text-secondary hover:bg-elevated'}`}>
                                                    <input type="checkbox" className="hidden" checked={formData.skills.fabricSpecialization.includes(fabric)} onChange={() => handleArrayToggle(fabric, 'fabricSpecialization', 'skills')} />
                                                    {fabric.replace('_', ' ')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="shadeMatching" checked={formData.skills.shadeMatching} onChange={e => handleNestedChange('skills', 'shadeMatching', e.target.checked)} className="h-4 w-4 text-primary rounded border-subtle" />
                                            <label htmlFor="shadeMatching" className="text-sm font-medium text-primary">Shade Matching (Approves lab dips)</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="chemicalHandling" checked={formData.skills.chemicalHandling} onChange={e => handleNestedChange('skills', 'chemicalHandling', e.target.checked)} className="h-4 w-4 text-primary rounded border-subtle" />
                                            <label htmlFor="chemicalHandling" className="text-sm font-medium text-primary">Chemical Handling (Caustic, acids)</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="firstAidTrained" checked={formData.skills.firstAidTrained} onChange={e => handleNestedChange('skills', 'firstAidTrained', e.target.checked)} className="h-4 w-4 text-primary rounded border-subtle" />
                                            <label htmlFor="firstAidTrained" className="text-sm font-medium text-primary">First Aid Trained</label>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-xs font-medium text-status-danger mb-2">Languages Known (Critical for migrant worker management)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {LANGUAGES.map(lang => (
                                                <label key={lang} className={`px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${formData.skills.languages.includes(lang) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-canvas border-subtle text-secondary hover:bg-elevated'}`}>
                                                    <input type="checkbox" className="hidden" checked={formData.skills.languages.includes(lang)} onChange={() => handleArrayToggle(lang, 'languages', 'skills')} />
                                                    {lang}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-6 border-t border-subtle flex justify-end gap-3 sticky bottom-0 bg-card shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] py-4">
                                <button type="button" onClick={closeModal} className="px-6 py-2.5 font-medium text-primary bg-elevated hover:bg-elevated rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="px-6 py-2.5 font-medium text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50 transition-colors shadow-sm"
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
