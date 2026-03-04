import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Settings, Users, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const SettingsLayout = () => {
 const location = useLocation();
 const { user } = useAuth();

 // Only Admin gets User Management. Store Manager might get Reports, depending on original logic.
 // Assuming ADMIN is the main target here.
 const isAdmin = user?.role === 'ADMIN';

 // Redirect /settings to /settings/users by default for Admin
 if (location.pathname === '/settings' || location.pathname === '/settings/') {
 return <Navigate to="/settings/users" replace />;
 }

 const tabs = [
 { name: 'User Management', path: '/settings/users', icon: Users, show: isAdmin },
 { name: 'Report Configuration', path: '/settings/reports', icon: FileText, show: isAdmin },
 ].filter(t => t.show);

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
 <Settings className="h-8 w-8 text-primary" />
 System Settings
 </h2>
 <p className="text-secondary mt-1">Configure user access and global system parameters</p>
 </div>

 {tabs.length > 0 && (
 <div className="bg-surface p-1.5 rounded-xl shadow-sm border border-border inline-flex overflow-x-auto w-full sm:w-auto">
 {tabs.map(tab => (
 <NavLink
 key={tab.path}
 to={tab.path}
 className={({ isActive }) =>
 `flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${isActive
 ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
 : 'text-secondary hover:text-primary hover:bg-background border border-transparent'
 }`
 }
 >
 <tab.icon className="h-4 w-4" />
 {tab.name}
 </NavLink>
 ))}
 </div>
 )}

 <div className="mt-6">
 <Outlet />
 </div>
 </div>
 );
};

export default SettingsLayout;
