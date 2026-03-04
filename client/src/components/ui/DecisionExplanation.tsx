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
            bg: 'bg-status-danger/10',
            border: 'border-status-danger/30',
            text: 'text-status-danger',
            iconColor: 'text-status-danger',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-status-warning/10',
            border: 'border-status-warning/30',
            text: 'text-status-warning',
            iconColor: 'text-status-warning',
        },
        good: {
            icon: CheckCircle,
            bg: 'bg-status-success/10',
            border: 'border-status-success/30',
            text: 'text-status-success',
            iconColor: 'text-status-success',
        },
        info: {
            icon: Info,
            bg: 'bg-canvas',
            border: 'border-subtle',
            text: 'text-primary',
            iconColor: 'text-secondary',
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
                            <span className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 block">
                                Why?
                            </span>
                            <ul className="list-disc list-inside text-sm text-primary space-y-1">
                                {reasons.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 block">
                                    Recommended Action
                                </span>
                                <p className="text-sm font-medium text-primary">
                                    {action}
                                </p>
                            </div>

                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 block">
                                    Impact if Ignored
                                </span>
                                <p className="text-sm text-primary italic">
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
