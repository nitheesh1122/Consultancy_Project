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
                { name: 'Audit Logs', path: '/audit-logs', icon: Settings, roles: ['ADMIN'] },
            ]
        }
    ];

    return (
        <div className="h-screen w-64 bg-card text-primary flex flex-col border-r border-subtle shadow-2xl shrink-0 transition-colors duration-300">
            {/* Branding Header */}
            <div className="p-6 border-b border-subtle bg-card sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center border border-brand-primary/20 shrink-0">
                        <Factory className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold font-heading tracking-tight text-primary leading-tight">
                            Golden Textile
                        </h1>
                        <p className="text-[10px] text-brand-primary uppercase tracking-wider font-semibold font-mono">Dyers ERP</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                {navSections.map((section, idx) => {
                    const visibleItems = section.items.filter(item => item.roles.includes(user?.role || ''));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx} className="mb-6">
                            <p className="px-6 py-2 text-xs uppercase tracking-wider text-muted font-heading font-semibold">
                                {section.label}
                            </p>
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 group relative ${isActive
                                                ? 'bg-brand-light text-brand-primary border-r-2 border-brand-primary'
                                                : 'text-secondary hover:bg-elevated hover:text-primary'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <item.icon className={`h-[18px] w-[18px] transition-all group-hover:scale-110 ${isActive ? 'text-brand-primary' : 'opacity-80'}`} />
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

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-subtle bg-card shrink-0">
                <div className="flex items-center gap-3 overflow-hidden mb-3 p-2 rounded-lg bg-elevated/50 border border-subtle">
                    <div className="h-9 w-9 shrink-0 rounded-md bg-brand-light flex items-center justify-center text-sm font-bold text-brand-primary border border-brand-primary/20">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-primary truncate leading-tight">{user?.username}</p>
                        <p className="text-xs text-secondary truncate lowercase font-mono">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center justify-center gap-2 px-3 py-2 w-full text-center text-xs font-medium text-status-danger bg-status-danger/5 border border-status-danger/20 hover:bg-status-danger/10 rounded-md transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="uppercase tracking-wider">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
