import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Package, FileText, ShoppingCart, LogOut, Truck, Settings, Users, RefreshCw, Factory, CalendarClock, Activity, TrendingUp } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navSections = [
        {
            label: 'Operations',
            items: [
                { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR', 'STORE_MANAGER', 'HR_MANAGER'] },
                { name: 'Analytics & Reports', path: '/analytics', icon: TrendingUp, roles: ['ADMIN', 'STORE_MANAGER'] },
            ]
        },
        {
            label: 'Materials',
            items: [
                { name: 'Inventory', path: '/inventory', icon: Package, roles: ['ADMIN', 'STORE_MANAGER'] },
                { name: 'Request Material', path: '/request-material', icon: FileText, roles: ['SUPERVISOR'] },
                { name: 'Return Material', path: '/return-material', icon: RefreshCw, roles: ['SUPERVISOR'] },
                { name: 'Material Requests', path: '/mrs-list', icon: FileText, roles: ['STORE_MANAGER'] },
            ]
        },
        {
            label: 'Procurement',
            items: [
                { name: 'Raise PI', path: '/raise-pi', icon: ShoppingCart, roles: ['STORE_MANAGER'] },
                { name: 'PI Approvals', path: '/pi-approvals', icon: ShoppingCart, roles: ['ADMIN'] },
                { name: 'Inward Entry', path: '/inward-entry', icon: Truck, roles: ['STORE_MANAGER'] },
                { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['ADMIN'] },
            ]
        },
        {
            label: 'Production Module',
            items: [
                { name: 'Machine Master', path: '/production/machines', icon: Factory, roles: ['STORE_MANAGER'] },
                { name: 'Incoming Lots', path: '/production/lots', icon: Package, roles: ['ADMIN', 'SUPERVISOR', 'STORE_MANAGER'] },
                { name: 'Schedule Batch', path: '/production/schedule', icon: CalendarClock, roles: ['SUPERVISOR'] },
                { name: 'My Batches', path: '/production/my-batches', icon: Activity, roles: ['SUPERVISOR'] },
                { name: 'Live Monitor', path: '/production/monitor', icon: Activity, roles: ['STORE_MANAGER', 'ADMIN'] },
            ]
        },
        {
            label: 'System Admin',
            items: [
                { name: 'Human Resources', path: '/hr', icon: Users, roles: ['ADMIN', 'HR_MANAGER'] },
                { name: 'System Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
                { name: 'Reports', path: '/reports', icon: FileText, roles: ['ADMIN'] },
                { name: 'Audit Logs', path: '/audit-logs', icon: Settings, roles: ['ADMIN'] },
            ]
        }
    ];

    return (
        <aside className="h-screen w-64 flex flex-col shrink-0 bg-card border-r border-subtle shadow-sm transition-colors duration-300">
            {/* Brand */}
            <div className="p-5 border-b border-subtle shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center shadow-sm">
                        <Factory className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold font-heading text-primary leading-tight">
                            Golden Textile
                        </h1>
                        <p className="text-[10px] text-brand-primary font-semibold uppercase tracking-wider font-mono">Dyers ERP</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                {navSections.map((section, idx) => {
                    const visibleItems = section.items.filter(item => item.roles.includes(user?.role || ''));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx} className="mb-5">
                            <p className="px-5 py-2 text-[11px] uppercase tracking-wider text-muted font-heading font-semibold">
                                {section.label}
                            </p>
                            <div className="space-y-0.5 px-3">
                                {visibleItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-brand-light text-brand-primary border border-brand-primary/20'
                                                : 'text-secondary hover:bg-elevated hover:text-primary'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-brand-primary' : 'opacity-70'}`} />
                                                <span>{item.name}</span>
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t border-subtle shrink-0 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-elevated border border-subtle">
                    <div className="h-9 w-9 shrink-0 rounded-md bg-brand-light flex items-center justify-center text-sm font-bold text-brand-primary border border-brand-primary/20">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{user?.username}</p>
                        <p className="text-xs text-muted truncate font-mono lowercase">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-status-danger bg-status-danger/10 border border-status-danger/20 hover:bg-status-danger/15 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
