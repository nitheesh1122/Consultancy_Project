import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Truck, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Suppliers = () => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const canCreate = ['ADMIN', 'MANAGER'].includes(user?.role || '');
 const [suppliers, setSuppliers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [creating, setCreating] = useState(false);
 const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', materialCategories: '' });
 const [showAccountModal, setShowAccountModal] = useState(false);
 const [accountCreating, setAccountCreating] = useState(false);
 const [selectedSupplierId, setSelectedSupplierId] = useState('');
 const [accountForm, setAccountForm] = useState({ username: '', password: '' });

 useEffect(() => {
 fetchSuppliers();
 }, []);

 const fetchSuppliers = async () => {
 try {
 const res = await api.get('/suppliers');
 // Populate stats for each supplier if the API returned just the list
 // For now assuming existing API returns list, but we might need to fetch stats individually 
 // OR ideally the GET /suppliers should return summary stats.
 // My controller getSuppliers returns just the list. 
 // I should update it to return stats or fetch them here.
 // For MVP I will just list them and let details page show stats, 
 // OR I can fetch stats for each (n+1) which is bad but ok for small list.
 setSuppliers(res.data);
 } catch (error) {
 console.error('Error fetching suppliers', error);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-bold text-primary">Supplier Management</h2>
 <p className="text-secondary">Monitor supplier performance and reliability</p>
 </div>
 {canCreate && <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover" onClick={() => setShowModal(true)}>
 Add Supplier
 </button>}
 </div>

 <div className="bg-surface rounded-xl shadow-sm overflow-hidden border border-border">
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-background">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Supplier</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Contact</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Categories</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="bg-surface divide-y divide-border">
 {loading ? (
 <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
 ) : suppliers.map((supplier) => (
 <tr key={supplier._id} className="hover:bg-background cursor-pointer" onClick={() => navigate(`/suppliers/${supplier._id}`)}>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <div className="h-10 w-10 flex-shrink-0 bg-primary/20 rounded-full flex items-center justify-center">
 <Truck className="h-5 w-5 text-primary" />
 </div>
 <div className="ml-4">
 <div className="text-sm font-medium text-primary">{supplier.name}</div>
 <div className="text-sm text-secondary">Since {new Date(supplier.createdAt).getFullYear()}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="text-sm text-primary">{supplier.contactPerson}</div>
 <div className="text-sm text-secondary">{supplier.phone}</div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex flex-wrap gap-1">
 {supplier.materialCategories.map((cat: string) => (
 <span key={cat} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
 {cat}
 </span>
 ))}
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
 {supplier.isActive ? 'Active' : 'Inactive'}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
 <div className="flex items-center justify-end gap-2">
 <span className="text-primary hover:text-primary">View Analytics</span>
 {user?.role === 'MANAGER' && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelectedSupplierId(supplier._id);
 setAccountForm({ username: '', password: '' });
 setShowAccountModal(true);
 }}
 className="px-2.5 py-1 text-xs rounded-md border border-subtle bg-background text-primary hover:bg-canvas"
 >
 Create Portal Account
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Add Supplier Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl border border-border">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-lg font-bold text-primary">Add Supplier</h3>
 <button onClick={() => setShowModal(false)} className="text-secondary hover:text-primary"><X className="h-5 w-5" /></button>
 </div>
 <form onSubmit={async (e) => {
 e.preventDefault();
 setCreating(true);
 try {
 const categories = form.materialCategories.split(',').map(c => c.trim()).filter(Boolean);
 await api.post('/suppliers', { ...form, materialCategories: categories });
 setShowModal(false);
 setForm({ name: '', contactPerson: '', phone: '', materialCategories: '' });
 fetchSuppliers();
 } catch (err: any) {
 alert(err?.response?.data?.message || 'Failed to create supplier');
 } finally {
 setCreating(false);
 }
 }} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-secondary mb-1">Company Name *</label>
 <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
 </div>
 <div>
 <label className="block text-sm font-medium text-secondary mb-1">Contact Person *</label>
 <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary" required value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
 </div>
 <div>
 <label className="block text-sm font-medium text-secondary mb-1">Phone *</label>
 <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
 </div>
 <div>
 <label className="block text-sm font-medium text-secondary mb-1">Material Categories (comma-separated)</label>
 <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary" placeholder="e.g. Dyes, Chemicals, Fabric" value={form.materialCategories} onChange={e => setForm(f => ({ ...f, materialCategories: e.target.value }))} />
 </div>
 <div className="flex justify-end gap-3 pt-2">
 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-secondary hover:bg-background">Cancel</button>
 <button type="submit" disabled={creating} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50">{creating ? 'Creating...' : 'Create Supplier'}</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {showAccountModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl border border-border">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-lg font-bold text-primary">Create Supplier Portal Account</h3>
 <button onClick={() => setShowAccountModal(false)} className="text-secondary hover:text-primary"><X className="h-5 w-5" /></button>
 </div>
 <form onSubmit={async (e) => {
 e.preventDefault();
 setAccountCreating(true);
 try {
 await api.post('/supplier/accounts', {
 supplierId: selectedSupplierId,
 username: accountForm.username,
 password: accountForm.password,
 });
 setShowAccountModal(false);
 setSelectedSupplierId('');
 setAccountForm({ username: '', password: '' });
 alert('Supplier portal account created');
 } catch (err: any) {
 alert(err?.response?.data?.message || 'Failed to create account');
 } finally {
 setAccountCreating(false);
 }
 }} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-secondary mb-1">Username *</label>
 <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary" required value={accountForm.username} onChange={e => setAccountForm(f => ({ ...f, username: e.target.value }))} />
 </div>
 <div>
 <label className="block text-sm font-medium text-secondary mb-1">Password *</label>
 <input type="password" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary" required value={accountForm.password} onChange={e => setAccountForm(f => ({ ...f, password: e.target.value }))} />
 </div>
 <div className="flex justify-end gap-3 pt-2">
 <button type="button" onClick={() => setShowAccountModal(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-secondary hover:bg-background">Cancel</button>
 <button type="submit" disabled={accountCreating} className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50">{accountCreating ? 'Creating...' : 'Create Account'}</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default Suppliers;
