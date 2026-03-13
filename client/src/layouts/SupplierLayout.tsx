import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Truck, FileText, ShoppingCart, Package, LogOut, LayoutDashboard } from 'lucide-react';

const SupplierLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/supplier/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/supplier/dashboard', icon: LayoutDashboard },
        { name: 'RFQs', path: '/supplier/rfq', icon: FileText },
        { name: 'Purchase Orders', path: '/supplier/purchase-orders', icon: ShoppingCart },
    ];

    return (
        <div className="flex h-screen bg-canvas">
            <aside className="h-screen w-64 flex flex-col shrink-0 bg-card border-r border-subtle shadow-sm">
                <div className="p-5 border-b border-subtle shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold font-heading text-primary leading-tight">Golden Textile</h1>
                            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider font-mono">Supplier Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-4 overflow-y-auto">
                    <div className="mb-5">
                        <p className="px-5 py-2 text-[11px] uppercase tracking-wider text-muted font-heading font-semibold">Navigation</p>
                        <div className="space-y-0.5 px-3">
                            {navItems.map((item) => (
                                <NavLink key={item.path} to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                            : 'text-secondary hover:bg-elevated hover:text-primary'}`
                                    }>
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-emerald-600' : 'opacity-70'}`} />
                                            <span>{item.name}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-subtle shrink-0 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-elevated border border-subtle">
                        <div className="h-9 w-9 shrink-0 rounded-md bg-emerald-50 flex items-center justify-center text-sm font-bold text-emerald-600 border border-emerald-200">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{user?.username}</p>
                            <p className="text-xs text-muted truncate font-mono lowercase">supplier</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-status-danger bg-status-danger/10 border border-status-danger/20 hover:bg-status-danger/15 rounded-lg transition-colors">
                        <LogOut className="h-4 w-4" />Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SupplierLayout;
