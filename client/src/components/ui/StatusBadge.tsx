import React from 'react';
import { cn } from './Button';

interface StatusBadgeProps {
    status: 'info' | 'success' | 'warning' | 'critical' | 'neutral';
    children: React.ReactNode;
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className }) => {
    const styles = {
        info: 'bg-status-info/10 text-status-info border-status-info/30',
        success: 'bg-status-success/10 text-status-success border-status-success/30',
        warning: 'bg-status-warning/10 text-status-warning border-status-warning/30',
        critical: 'bg-status-danger/10 text-status-danger border-status-danger/30',
        neutral: 'bg-elevated text-secondary border-subtle',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                styles[status],
                className
            )}
        >
            {children}
        </span>
    );
};

export default StatusBadge;
