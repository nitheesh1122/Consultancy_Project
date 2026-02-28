import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const HrLayout = () => {
    const location = useLocation();

    if (location.pathname === '/hr' || location.pathname === '/hr/') {
        return <Navigate to="/hr/workers" replace />;
    }

    const tabs = [
        { name: 'Worker Directory', path: '/hr/workers', icon: Users },
        { name: 'Attendance', path: '/hr/attendance', icon: Clock },
        { name: 'Performance Metrics', path: '/hr/performance', icon: TrendingUp },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Users className="h-8 w-8 text-indigo-600" />
                    Human Resources
                </h2>
                <p className="text-gray-500 mt-1">Manage workforce directory, attendance, and analytics</p>
            </div>

            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 inline-flex overflow-x-auto w-full sm:w-auto">
                {tabs.map(tab => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${isActive
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
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

export default HrLayout;
