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
        default: 'border-slate-200',
        critical: 'border-rose-200 bg-rose-50/30',
        warning: 'border-amber-200 bg-amber-50/30',
        good: 'border-emerald-200 bg-emerald-50/30',
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md cursor-default',
                statusStyles[status],
                onClick && 'cursor-pointer',
                className
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 font-heading">{title}</p>
                {Icon && <Icon className="h-5 w-5 text-slate-400" />}
            </div>

            <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    {value}
                </h3>
            </div>

            {trend && (
                <div className="mt-3 flex items-center text-xs">
                    <span
                        className={cn(
                            "flex items-center font-medium",
                            trend.isPositive ? "text-emerald-600" : "text-rose-600",
                            // If status is critical, maybe flip logic depending on metric, but kept simple here
                        )}
                    >
                        {trend.isPositive ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                        {Math.abs(trend.value)}%
                    </span>
                    <span className="ml-2 text-slate-400">{trend.label || "vs last month"}</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
