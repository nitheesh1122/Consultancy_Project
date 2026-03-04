import React from 'react';
import { cn } from './Button';

interface StatusBadgeProps {
    status: 'info' | 'success' | 'warning' | 'critical' | 'neutral';
    children: React.ReactNode;
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className }) => {
    const styles = {
        info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        critical: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
        neutral: 'bg-elevated text-secondary border-subtle',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                styles[status],
                className
            )}
        >
            {children}
        </span>
    );
};

export default StatusBadge;
