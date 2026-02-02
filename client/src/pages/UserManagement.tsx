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
            <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
                <div className="p-2 bg-slate-900 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 text-sm">Manage system access and roles.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create User Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
                            Register New User
                        </h3>

                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5" />
                                <span className="text-xs font-medium text-rose-700">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Username / ID</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. EMP-2024-01"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="••••••••"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Role Permission</label>
                                <select
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Active System Users</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase">User Details</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase">Role Access</th>
                                        <th className="px-6 py-3 text-xs font-semibold uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-500">Loading users...</td></tr>
                                    ) : users.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-500 italic">No users found.</td></tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                                            <Users className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 text-sm">{user.username}</p>
                                                            <p className="text-xs text-slate-400">ID: {user._id.slice(-6)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-slate-900 text-white border-slate-900' :
                                                            user.role === 'STORE_MANAGER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-md hover:bg-rose-50"
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
