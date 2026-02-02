import React from 'react';
import { cn } from './Button';

interface StatusBadgeProps {
    status: 'info' | 'success' | 'warning' | 'critical' | 'neutral';
    children: React.ReactNode;
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className }) => {
    const styles = {
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        critical: 'bg-rose-100 text-rose-700 border-rose-200',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                styles[status],
                className
            )}
        >
            {children}
        </span>
    );
};

export default StatusBadge;
