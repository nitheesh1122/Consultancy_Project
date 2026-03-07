import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] animate-fade-in">
            <div className="bg-status-danger/10 p-6 rounded-full mb-6">
                <ShieldAlert className="h-16 w-16 text-status-danger" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-primary mb-2">Unauthorized Access</h1>
            <p className="text-secondary text-center max-w-md mb-8">
                You do not have the required administrative permissions to view this module. If you believe this is an error, please contact your system administrator.
            </p>
            <Link
                to="/"
                className="px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-xl shadow-md hover:bg-brand-hover transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    );
};

export default Unauthorized;
