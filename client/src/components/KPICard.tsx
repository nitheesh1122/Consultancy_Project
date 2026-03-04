import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './ui/Button';

interface KPICardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    trendDirection = 'neutral',
    status = 'neutral'
}) => {
    const statusBorders = {
        success: 'border-b-success',
        warning: 'border-b-warning',
        danger: 'border-b-danger',
        info: 'border-b-info',
        neutral: 'border-b-transparent',
    };

    const trendColors = {
        up: 'text-status-success',
        down: 'text-status-danger',
        neutral: 'text-secondary',
    };

    return (
        <div className={cn("industrial-card p-5 relative overflow-hidden border-b-4", statusBorders[status])}>
            <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-heading text-secondary uppercase tracking-wide">{title}</p>
                {Icon && (
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-light text-brand-primary shrink-0">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-3xl font-bold text-primary font-mono tracking-tight">{value}</h3>
                {trend && (
                    <div className={cn("flex items-center mt-2 text-xs font-medium", trendColors[trendDirection])}>
                        {trendDirection === 'up' && <span className="mr-1">↑</span>}
                        {trendDirection === 'down' && <span className="mr-1">↓</span>}
                        {trendDirection === 'neutral' && <span className="mr-1">-</span>}
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KPICard;
