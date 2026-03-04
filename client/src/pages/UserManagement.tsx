import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, UserPlus, Save, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

const UserManagement = () => {
 const [users, setUsers] = useState<any[]>([]);
 const [newUser, setNewUser] = useState({ username: '', password: '', role: 'SUPERVISOR' });
 const [loading, setLoading] = useState(true);
 const [creating, setCreating] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
 fetchUsers();
 }, []);

 const fetchUsers = async () => {
 try {
 const { data } = await api.get('/auth');
 setUsers(data);
 setError('');
 } catch (error) {
 console.error('Failed to fetch users', error);
 } finally {
 setLoading(false);
 }
 };

 const handleCreate = async (e: React.FormEvent) => {
 e.preventDefault();
 setCreating(true);
 setError('');
 try {
 await api.post('/auth/register', newUser);
 setNewUser({ username: '', password: '', role: 'SUPERVISOR' });
 fetchUsers(); // Refresh list
 } catch (error: any) {
 setError(error.response?.data?.message || 'Failed to create user');
 } finally {
 setCreating(false);
 }
 };

 const handleDelete = async (id: string) => {
 if (!window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) return;
 try {
 await api.delete(`/auth/${id}`);
 setUsers(users.filter(u => u._id !== id));
 } catch (error) {
 console.error('Failed to delete user', error);
 alert('Failed to delete user');
 }
 };

 return (
 <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
 <div className="flex items-center gap-3 border-b border-border pb-5">
 <div className="p-2 bg-surface rounded-lg">
 <Users className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">User Management</h1>
 <p className="text-secondary text-sm">Manage system access and roles.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Create User Form */}
 <div className="lg:col-span-1">
 <div className="bg-surface p-6 rounded-xl shadow-sm border border-border sticky top-6">
 <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
 <UserPlus className="w-5 h-5 mr-2 text-primary" />
 Register New User
 </h3>

 {error && (
 <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2">
 <AlertTriangle className="h-4 w-4 text-danger mt-0.5" />
 <span className="text-xs font-medium text-danger">{error}</span>
 </div>
 )}

 <form onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-primary uppercase tracking-wide mb-1">Username / ID</label>
 <input
 type="text"
 required
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
 placeholder="e.g. EMP-2024-01"
 value={newUser.username}
 onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-primary uppercase tracking-wide mb-1">Password</label>
 <input
 type="password"
 required
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
 placeholder="••••••••"
 value={newUser.password}
 onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-primary uppercase tracking-wide mb-1">Role Permission</label>
 <select
 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
 value={newUser.role}
 onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
 >
 <option value="SUPERVISOR">Supervisor (Floor Access)</option>
 <option value="STORE_MANAGER">Store Manager (Inventory)</option>
 <option value="ADMIN">Administrator (Full Access)</option>
 </select>
 </div>
 <Button
 type="submit"
 className="w-full justify-center"
 isLoading={creating}
 variant="primary"
 >
 <Save className="w-4 h-4 mr-2" /> Create User Account
 </Button>
 </form>
 </div>
 </div>

 {/* User List */}
 <div className="lg:col-span-2">
 <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
 <div className="px-6 py-4 border-b border-border bg-background/50">
 <h3 className="font-bold text-primary text-sm uppercase tracking-wide">Active System Users</h3>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-background text-secondary border-b border-border">
 <tr>
 <th className="px-6 py-3 text-xs font-semibold uppercase">User Details</th>
 <th className="px-6 py-3 text-xs font-semibold uppercase">Role Access</th>
 <th className="px-6 py-3 text-xs font-semibold uppercase text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {loading ? (
 <tr><td colSpan={3} className="p-8 text-center text-secondary">Loading users...</td></tr>
 ) : users.length === 0 ? (
 <tr><td colSpan={3} className="p-8 text-center text-secondary italic">No users found.</td></tr>
 ) : (
 users.map((user) => (
 <tr key={user._id} className="hover:bg-background transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="bg-primary/20 p-2 rounded-full text-primary">
 <Users className="h-4 w-4" />
 </div>
 <div>
 <p className="font-semibold text-primary text-sm">{user.username}</p>
 <p className="text-xs text-muted">ID: {user._id.slice(-6)}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-surface text-primary border-border' :
 user.role === 'STORE_MANAGER' ? 'bg-primary/10 text-primary border-primary/30' :
 'bg-surface-highlight text-secondary border-border'
 }`}>
 {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
 {user.role.replace('_', ' ')}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button
 onClick={() => handleDelete(user._id)}
 className="text-muted hover:text-danger transition-colors p-2 rounded-md hover:bg-danger/10"
 title="Delete User"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default UserManagement;
