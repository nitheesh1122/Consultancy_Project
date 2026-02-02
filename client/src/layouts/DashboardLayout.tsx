import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LoadingScreen from '../components/ui/LoadingScreen';

const DashboardLayout = () => {
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    // Simulate initial loading only on mount, or we could listen to navigation
    // Requirement says "Initial app load, Route/page transitions"
    // For route transitions, we can trigger effect on location change

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // 800ms transition as per requirement (600-1200ms)

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className="flex bg-slate-50 min-h-screen text-slate-900 font-sans">
            {isLoading && <LoadingScreen />}
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen relative">
                {/* Optional: Add a subtle breadcrumb or top header here if needed for mobile */}
                <div className="max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
