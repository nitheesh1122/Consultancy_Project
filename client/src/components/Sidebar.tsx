import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Package, FileText, ShoppingCart, LogOut, Truck } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR', 'STORE_MANAGER'] },
        { name: 'Request Material', path: '/request-material', icon: FileText, roles: ['SUPERVISOR'] },
        { name: 'Material Requests', path: '/mrs-list', icon: FileText, roles: ['STORE_MANAGER'] },
        { name: 'Inventory', path: '/inventory', icon: Package, roles: ['ADMIN', 'STORE_MANAGER'] },
        { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['ADMIN'] },
        { name: 'Raise PI', path: '/raise-pi', icon: ShoppingCart, roles: ['STORE_MANAGER'] },
        { name: 'Inward Entry', path: '/inward-entry', icon: Truck, roles: ['STORE_MANAGER'] },
        { name: 'PI Approvals', path: '/pi-approvals', icon: ShoppingCart, roles: ['ADMIN'] },
        { name: 'Reports', path: '/reports', icon: FileText, roles: ['ADMIN', 'STORE_MANAGER'] },
    ];

    return (
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">Consultancy App</h1>
                    <p className="text-xs text-gray-400 mt-1">{user?.username} ({user?.role})</p>
                </div>
                <NotificationBell />
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    if (!item.roles.includes(user?.role || '')) return null;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
