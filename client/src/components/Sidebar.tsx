import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Package, FileText, ShoppingCart, LogOut, Truck, Settings, Users } from 'lucide-react';
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
        { name: 'User Management', path: '/users', icon: Users, roles: ['ADMIN'] },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shadow-xl">
            {/* Branding Header */}
            <div className="p-6 border-b border-slate-800">
                <div>
                    {/* Text-based Logo as required */}
                    <h1 className="text-lg font-bold font-heading tracking-tight text-white leading-tight">
                        Golden Textile<br />Dyers
                    </h1>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-medium">Internal Ops System</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    if (item.roles && !item.roles.includes(user?.role || '')) return null;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-slate-800 text-white shadow-inner border-l-4 border-slate-400'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`
                            }
                        >
                            <item.icon className="h-4 w-4 opacity-75 group-hover:opacity-100 transition-opacity" />
                            <span>{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate w-24">{user?.username}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                        </div>
                    </div>
                    <NotificationBell />
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-md transition-colors"
                >
                    <LogOut className="h-3 w-3" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
