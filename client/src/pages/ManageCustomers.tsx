import { useState, useEffect } from 'react';
import api from '../lib/api';
import { UserPlus, Building2, Phone, Mail, Search } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const ManageCustomers = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        name: '', companyName: '', contact: '', email: '', address: '', username: '', password: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get('/customer/customers');
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.companyName || !form.contact || !form.email || !form.username || !form.password) {
            toast.error('All fields are required');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/customer/customers', form);
            toast.success('Customer created successfully');
            setShowModal(false);
            setForm({ name: '', companyName: '', contact: '', email: '', address: '', username: '', password: '' });
            fetchCustomers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create customer');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end border-b border-subtle pb-6">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Manage Customers</h1>
                    <p className="text-secondary mt-1 text-sm">Create and manage customer accounts for the customer portal</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors">
                    <UserPlus className="h-4 w-4" />
                    Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                    type="text"
                    placeholder="Search by name, company, or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-subtle rounded-lg text-sm text-primary placeholder-muted focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-subtle p-4">
                    <p className="text-muted text-xs uppercase tracking-wide font-semibold">Total Customers</p>
                    <p className="text-2xl font-bold text-primary mt-1">{customers.length}</p>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-4">
                    <p className="text-muted text-xs uppercase tracking-wide font-semibold">Active</p>
                    <p className="text-2xl font-bold text-status-success mt-1">{customers.filter(c => c.isActive !== false).length}</p>
                </div>
                <div className="bg-card rounded-xl border border-subtle p-4">
                    <p className="text-muted text-xs uppercase tracking-wide font-semibold">Inactive</p>
                    <p className="text-2xl font-bold text-status-danger mt-1">{customers.filter(c => c.isActive === false).length}</p>
                </div>
            </div>

            {/* Customer Table */}
            <div className="bg-card rounded-xl border border-subtle shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-elevated border-b border-subtle">
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No customers found</td></tr>
                        ) : filtered.map(c => (
                            <tr key={c._id} className="hover:bg-elevated/50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-primary">{c.name}</td>
                                <td className="px-4 py-3 text-secondary flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-muted" /> {c.companyName}
                                </td>
                                <td className="px-4 py-3 text-secondary flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-muted" /> {c.contact}
                                </td>
                                <td className="px-4 py-3 text-secondary flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-muted" /> {c.email}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                        {c.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Customer Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Customer">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Full Name *</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-sm text-primary focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Company Name *</label>
                            <input type="text" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-sm text-primary focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Phone *</label>
                            <input type="text" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-sm text-primary focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Email *</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-sm text-primary focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted uppercase tracking-wide">Address</label>
                        <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                            className="mt-1 w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-sm text-primary focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                    </div>
                    <hr className="border-subtle" />
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide">Portal Login Credentials</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Username *</label>
                            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-sm text-primary focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Password *</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-elevated border border-subtle rounded-lg text-sm text-primary focus:ring-2 focus:ring-brand-primary/30 outline-none" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50">
                            {submitting ? 'Creating...' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageCustomers;
