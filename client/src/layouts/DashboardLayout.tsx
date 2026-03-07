import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LoadingScreen from '../components/ui/LoadingScreen';
import NotificationBell from '../components/NotificationBell';
import { Search } from 'lucide-react';

const DashboardLayout = () => {
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className="flex bg-canvas min-h-screen text-primary font-sans transition-colors duration-300">
            {isLoading && <LoadingScreen />}
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 shrink-0 border-b border-subtle bg-card flex items-center justify-between px-6 shadow-sm">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-muted group-focus-within:text-brand-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-4 py-2 bg-elevated border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 text-sm transition-colors"
                                placeholder="Search (Ctrl+K)..."
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-canvas">
                    <div className="w-full max-w-[1600px] mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
