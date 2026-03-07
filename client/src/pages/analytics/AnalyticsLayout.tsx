import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { TrendingUp, Package, Factory, Users, Truck } from 'lucide-react';

const AnalyticsLayout = () => {
    const location = useLocation();

    // Redirect /analytics to /analytics/inventory by default
    if (location.pathname === '/analytics' || location.pathname === '/analytics/') {
        return <Navigate to="/analytics/inventory" replace />;
    }

    const tabs = [
        { name: 'Inventory', path: '/analytics/inventory', icon: Package },
        { name: 'Production', path: '/analytics/production', icon: Factory },
        { name: 'Workers', path: '/analytics/workers', icon: Users },
        { name: 'Suppliers', path: '/analytics/suppliers', icon: Truck },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-primary font-heading flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-brand-primary" />
                    Enterprise Analytics
                </h2>
                <p className="text-secondary mt-1">Cross-departmental performance metrics and insights</p>
            </div>

            <div className="bg-elevated p-1.5 rounded-xl border border-subtle inline-flex overflow-x-auto w-full sm:w-auto">
                {tabs.map(tab => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-6 py-2.5 text-sm font-bold tracking-wide rounded-lg transition-all whitespace-nowrap ${isActive
                                ? 'bg-brand-light text-brand-primary border border-brand-primary/20'
                                : 'text-secondary hover:text-brand-primary hover:bg-canvas border border-transparent'
                            }`
                        }
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.name}
                    </NavLink>
                ))}
            </div>

            <div className="mt-6">
                <Outlet />
            </div>
        </div>
    );
};

export default AnalyticsLayout;
