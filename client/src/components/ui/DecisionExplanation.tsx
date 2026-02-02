import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from './Button';

interface DecisionExplanationProps {
    status: 'critical' | 'warning' | 'good' | 'info';
    title: string;
    reasons: string[];
    action: string;
    impact: string;
    className?: string;
}

const DecisionExplanation: React.FC<DecisionExplanationProps> = ({
    status,
    title,
    reasons,
    action,
    impact,
    className,
}) => {
    const config = {
        critical: {
            icon: AlertCircle,
            bg: 'bg-rose-50',
            border: 'border-rose-200',
            text: 'text-rose-900',
            iconColor: 'text-rose-600',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-900',
            iconColor: 'text-amber-600',
        },
        good: {
            icon: CheckCircle,
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-900',
            iconColor: 'text-emerald-600',
        },
        info: {
            icon: Info,
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-900',
            iconColor: 'text-slate-600',
        },
    };

    const current = config[status];
    const Icon = current.icon;

    return (
        <div
            className={cn(
                'rounded-lg border p-4 my-4 font-sans',
                current.bg,
                current.border,
                className
            )}
        >
            <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", current.iconColor)} />
                <div className="flex-1">
                    <h4 className={cn("font-semibold text-sm mb-2", current.text)}>
                        {title}
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                Why?
                            </span>
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                {reasons.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                    Recommended Action
                                </span>
                                <p className="text-sm font-medium text-slate-900">
                                    {action}
                                </p>
                            </div>

                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                                    Impact if Ignored
                                </span>
                                <p className="text-sm text-slate-700 italic">
                                    {impact}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DecisionExplanation;
