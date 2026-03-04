import React from 'react';
import { cn } from './Button';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    trend?: {
        value: number; // percentage
        isPositive: boolean;
        label?: string; // e.g. "vs last month"
    };
    icon?: React.ElementType; // Icon component
    status?: 'default' | 'critical' | 'warning' | 'good';
    className?: string;
    onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    trend,
    icon: Icon,
    status = 'default',
    className,
    onClick,
}) => {
    const statusStyles = {
        default: 'border-subtle bg-card',
        critical: 'border-status-danger/30 bg-status-danger/5',
        warning: 'border-status-warning/30 bg-status-warning/5',
        good: 'border-status-success/30 bg-status-success/5',
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all hover:shadow-md cursor-default',
                statusStyles[status],
                onClick && 'cursor-pointer',
                className
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-secondary uppercase tracking-wider font-heading">{title}</p>
                {Icon && <Icon className="h-5 w-5 text-muted" />}
            </div>

            <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-primary tracking-tight font-mono tabular-nums">
                    {value}
                </h3>
            </div>

            {trend && (
                <div className="mt-3 flex items-center text-xs">
                    <span
                        className={cn(
                            "flex items-center font-bold",
                            trend.isPositive ? "text-status-success" : "text-status-danger",
                        )}
                    >
                        {trend.isPositive ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                        {Math.abs(trend.value)}%
                    </span>
                    <span className="ml-2 text-muted">{trend.label || "vs last month"}</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
