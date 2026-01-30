import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, UserPlus, Save } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]); // Need an API for this, will stub or create
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'SUPERVISOR' });
    const [loading, setLoading] = useState(false); // List loading
    const [creating, setCreating] = useState(false);

    // Note: We haven't created a 'getUsers' API yet. 
    // I will add a 'Register User' form which works with existing auth API
    // Listing users requires a new endpoint `GET /api/auth/users` which I will add to backend next.

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/auth/register', newUser);
            alert('User Created Successfully');
            setNewUser({ username: '', password: '', role: 'SUPERVISOR' });
            // refresh list if we had one
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Users className="w-6 h-6 mr-2 text-indigo-600" />
                User Management
            </h2>

            {/* Create User Form - Reusing Register Logic */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 flex items-center text-gray-700">
                    <UserPlus className="w-5 h-5 mr-2" /> Create New User
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full border p-2 rounded"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border p-2 rounded"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                        <select
                            className="w-full border p-2 rounded"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="SUPERVISOR">Supervisor</option>
                            <option value="STORE_MANAGER">Store Manager</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div>
                        <button
                            disabled={creating}
                            className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 flex justify-center items-center"
                        >
                            <Save className="w-4 h-4 mr-2" /> Save User
                        </button>
                    </div>
                </form>
            </div>

            {/* User List Placeholder - Since we didn't explicitly implement GET /users yet */}
            <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 text-center text-gray-500">
                User Listing API Integration Pending. You can currently add users above.
            </div>
        </div>
    );
};

export default UserManagement;
