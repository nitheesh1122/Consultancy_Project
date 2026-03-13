import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown, TrendingUp } from 'lucide-react';

export type DecisionActionStatus = 'CLICKED' | 'IGNORED' | 'RESOLVED';

export interface DecisionFeedItem {
    id: string;
    domain: 'inventory' | 'procurement' | 'production' | 'customer' | 'hr';
    priority: number;
    signal: 'critical' | 'warning' | 'good';
    metric: string;
    currentValue: number;
    previousValue: number;
    deltaPercent: number;
    trendSignal: 'improving' | 'stable' | 'deteriorating';
    reason: string[];
    recommendedAction: string;
    actionLink: string;
    expectedImpact: string;
}

interface DecisionFeedPanelProps {
    title: string;
    windowLabel: string;
    topActions: DecisionFeedItem[];
    onTrackAction: (item: DecisionFeedItem, status: DecisionActionStatus) => void;
}

const signalClassMap: Record<DecisionFeedItem['signal'], string> = {
    critical: 'border-status-danger/40 bg-status-danger/10',
    warning: 'border-status-warning/40 bg-status-warning/10',
    good: 'border-status-success/40 bg-status-success/10',
};

const signalLabelMap: Record<DecisionFeedItem['signal'], string> = {
    critical: 'Critical',
    warning: 'Warning',
    good: 'Good',
};

const trendClassMap: Record<DecisionFeedItem['trendSignal'], string> = {
    improving: 'text-status-success',
    stable: 'text-secondary',
    deteriorating: 'text-status-danger',
};

const domainLabelMap: Record<DecisionFeedItem['domain'], string> = {
    inventory: 'Inventory',
    procurement: 'Procurement',
    production: 'Production',
    customer: 'Customer',
    hr: 'HR',
};

const formatDelta = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

const DecisionFeedPanel: React.FC<DecisionFeedPanelProps> = ({
    title,
    windowLabel,
    topActions,
    onTrackAction,
}) => {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-subtle bg-canvas/40 flex items-center justify-between">
                <div>
                    <h2 className="text-sm uppercase tracking-wide font-bold text-primary">{title}</h2>
                    <p className="text-xs text-secondary mt-1">Based on {windowLabel} trends and current operational risk.</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-secondary">
                    <Clock className="h-3.5 w-3.5" />
                    Decision-grade analytics
                </span>
            </div>

            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                {topActions.length === 0 && (
                    <div className="col-span-full p-6 rounded-lg border border-status-success/30 bg-status-success/10 text-status-success text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        No urgent actions right now. All tracked KPIs are on a healthy trend.
                    </div>
                )}

                {topActions.map((item) => (
                    <div key={item.id} className={`rounded-lg border p-4 ${signalClassMap[item.signal]}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] uppercase tracking-wide font-semibold text-secondary">{domainLabelMap[item.domain]}</span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-canvas border border-subtle text-secondary">
                                        {signalLabelMap[item.signal]}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-primary mt-1">{item.metric}</p>
                            </div>
                            {item.signal === 'critical' ? (
                                <AlertTriangle className="h-5 w-5 text-status-danger" />
                            ) : item.trendSignal === 'deteriorating' ? (
                                <TrendingDown className="h-5 w-5 text-status-danger" />
                            ) : (
                                <TrendingUp className="h-5 w-5 text-status-success" />
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                            <div className="bg-canvas rounded-md p-2 border border-subtle">
                                <p className="text-muted">Current</p>
                                <p className="font-semibold text-primary mt-0.5">{item.currentValue}</p>
                            </div>
                            <div className="bg-canvas rounded-md p-2 border border-subtle">
                                <p className="text-muted">Previous</p>
                                <p className="font-semibold text-primary mt-0.5">{item.previousValue}</p>
                            </div>
                            <div className="bg-canvas rounded-md p-2 border border-subtle">
                                <p className="text-muted">Delta</p>
                                <p className={`font-semibold mt-0.5 ${trendClassMap[item.trendSignal]}`}>{formatDelta(item.deltaPercent)}</p>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            {item.reason.slice(0, 2).map((driver, index) => (
                                <p key={`${item.id}-${index}`} className="text-xs text-secondary">
                                    - {driver}
                                </p>
                            ))}
                        </div>

                        <div className="mt-3 p-2.5 rounded-md bg-canvas border border-subtle">
                            <p className="text-xs text-primary font-semibold">Action: {item.recommendedAction}</p>
                            <p className="text-xs text-secondary mt-1">Impact: {item.expectedImpact}</p>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <Link
                                to={item.actionLink}
                                onClick={() => onTrackAction(item, 'CLICKED')}
                                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white hover:opacity-90 transition-opacity"
                            >
                                Take Action
                            </Link>
                            <Link
                                to={`/analytics/decision-board?decisionId=${item.id}&window=30d`}
                                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold border border-subtle text-primary hover:bg-canvas transition-colors"
                            >
                                Drill Down
                            </Link>
                            <button
                                type="button"
                                onClick={() => onTrackAction(item, 'IGNORED')}
                                className="rounded-md px-3 py-1.5 text-xs font-semibold border border-subtle text-secondary hover:bg-canvas transition-colors"
                            >
                                Ignore
                            </button>
                            <button
                                type="button"
                                onClick={() => onTrackAction(item, 'RESOLVED')}
                                className="rounded-md px-3 py-1.5 text-xs font-semibold border border-status-success/30 text-status-success hover:bg-status-success/10 transition-colors"
                            >
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DecisionFeedPanel;
