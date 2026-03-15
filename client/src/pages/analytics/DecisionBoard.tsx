import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Loader2, ListTree, Radar } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

type DecisionItem = {
    id: string;
    domain: 'inventory' | 'procurement' | 'production' | 'customer' | 'hr';
    signal: 'critical' | 'warning' | 'good';
    metric: string;
    currentValue: number;
    previousValue: number;
    deltaPercent: number;
    recommendedAction: string;
    actionLink: string;
};

type DrilldownResponse = {
    decisionId: string;
    title: string;
    columns: Array<{ key: string; label: string }>;
    rows: Array<Record<string, any>>;
};

const signalClassMap: Record<DecisionItem['signal'], string> = {
    critical: 'bg-status-danger/10 border-status-danger/30 text-status-danger',
    warning: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
    good: 'bg-status-success/10 border-status-success/30 text-status-success',
};

const DecisionBoard = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [window, setWindow] = useState(searchParams.get('window') || '30d');
    const [newFormula, setNewFormula] = useState({
        metricId: '',
        formula: '',
        desiredDirection: 'UP',
        roles: 'ADMIN,MANAGER',
        changeNote: ''
    });
    const [savingFormula, setSavingFormula] = useState(false);

    const { data: decisionFeed, isLoading: loadingFeed } = useQuery({
        queryKey: ['decision-feed-board', window],
        queryFn: async () => {
            const res = await api.get(`/analytics/decision-feed?window=${window}`);
            return res.data as { decisions: DecisionItem[] };
        },
    });

    const { data: dashboardSummary } = useQuery({
        queryKey: ['analytics-dashboard-summary'],
        queryFn: async () => (await api.get('/analytics/dashboard')).data,
    });

    const { data: kpiDictionary } = useQuery({
        queryKey: ['kpi-dictionary'],
        queryFn: async () => (await api.get('/analytics/kpi-dictionary')).data,
    });

    const { data: dataQuality } = useQuery({
        queryKey: ['analytics-data-quality'],
        queryFn: async () => (await api.get('/analytics/data-quality')).data,
    });

    const { data: snapshots } = useQuery({
        queryKey: ['decision-snapshots', window],
        queryFn: async () => (await api.get(`/analytics/decision-snapshots?window=${window}`)).data,
    });

    const selectedDecisionId = searchParams.get('decisionId') || decisionFeed?.decisions?.[0]?.id || '';

    const { data: drilldown, isLoading: loadingDrilldown } = useQuery({
        queryKey: ['decision-drilldown', selectedDecisionId, window],
        queryFn: async () => {
            const res = await api.get(`/analytics/decision-drilldown/${selectedDecisionId}?window=${window}`);
            return res.data as DrilldownResponse;
        },
        enabled: Boolean(selectedDecisionId),
    });

    const selectDecision = (decisionId: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('decisionId', decisionId);
        next.set('window', window);
        setSearchParams(next);
    };

    const onWindowChange = (nextWindow: string) => {
        setWindow(nextWindow);
        const next = new URLSearchParams(searchParams);
        next.set('window', nextWindow);
        if (!next.get('decisionId') && decisionFeed?.decisions?.[0]?.id) {
            next.set('decisionId', decisionFeed.decisions[0].id);
        }
        setSearchParams(next);
    };

    const decisions = decisionFeed?.decisions || [];

    const createKpiFormulaVersion = async () => {
        setSavingFormula(true);
        try {
            await api.post('/analytics/kpi-formula-versions', {
                metricId: newFormula.metricId,
                formula: newFormula.formula,
                desiredDirection: newFormula.desiredDirection,
                roles: newFormula.roles.split(',').map((r) => r.trim()).filter(Boolean),
                changeNote: newFormula.changeNote || undefined,
            });
            setNewFormula({
                metricId: '',
                formula: '',
                desiredDirection: 'UP',
                roles: 'ADMIN,MANAGER',
                changeNote: ''
            });
        } finally {
            setSavingFormula(false);
        }
    };

    const selectedDecision = useMemo(
        () => decisions.find((item) => item.id === selectedDecisionId) || decisions[0],
        [decisions, selectedDecisionId]
    );

    if (loadingFeed) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-card border border-subtle rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-secondary">Dashboard Signals</p>
                    <p className="text-2xl font-bold text-primary mt-1">{dashboardSummary?.decisionFeed?.length || decisions.length || 0}</p>
                </div>
                <div className="bg-card border border-subtle rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-secondary">KPI Definitions</p>
                    <p className="text-2xl font-bold text-primary mt-1">{kpiDictionary?.kpis?.length || 0}</p>
                </div>
                <div className="bg-card border border-subtle rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-secondary">Data Quality Score</p>
                    <p className="text-2xl font-bold text-primary mt-1">{dataQuality?.score ?? dataQuality?.completenessScore ?? '-'}</p>
                </div>
                <div className="bg-card border border-subtle rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-secondary">Decision Snapshots</p>
                    <p className="text-2xl font-bold text-primary mt-1">{snapshots?.snapshots?.length || 0}</p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="text-xl font-bold text-primary font-heading flex items-center gap-2">
                        <Radar className="h-5 w-5 text-brand-primary" />
                        Decision Board
                    </h3>
                    <p className="text-sm text-secondary mt-1">Card &#8594; table &#8594; record flow for operational decisions.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-subtle p-1 bg-elevated">
                    {['7d', '30d', '90d', 'MTD', 'QTD'].map((w) => (
                        <button
                            key={w}
                            type="button"
                            onClick={() => onWindowChange(w)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold ${window === w ? 'bg-brand-primary text-white' : 'text-secondary hover:bg-canvas'}`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
            </div>

            {user?.role === 'MANAGER' && (
                <div className="bg-card border border-subtle rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-primary">Create KPI Formula Version</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            value={newFormula.metricId}
                            onChange={(e) => setNewFormula((f) => ({ ...f, metricId: e.target.value }))}
                            placeholder="metricId"
                            className="h-10 px-3 rounded-lg border border-subtle bg-canvas text-sm"
                        />
                        <select
                            value={newFormula.desiredDirection}
                            onChange={(e) => setNewFormula((f) => ({ ...f, desiredDirection: e.target.value }))}
                            className="h-10 px-3 rounded-lg border border-subtle bg-canvas text-sm"
                        >
                            <option value="UP">UP</option>
                            <option value="DOWN">DOWN</option>
                        </select>
                        <input
                            value={newFormula.formula}
                            onChange={(e) => setNewFormula((f) => ({ ...f, formula: e.target.value }))}
                            placeholder="formula"
                            className="h-10 px-3 rounded-lg border border-subtle bg-canvas text-sm"
                        />
                        <input
                            value={newFormula.roles}
                            onChange={(e) => setNewFormula((f) => ({ ...f, roles: e.target.value }))}
                            placeholder="roles comma separated"
                            className="h-10 px-3 rounded-lg border border-subtle bg-canvas text-sm"
                        />
                    </div>
                    <input
                        value={newFormula.changeNote}
                        onChange={(e) => setNewFormula((f) => ({ ...f, changeNote: e.target.value }))}
                        placeholder="change note"
                        className="h-10 w-full px-3 rounded-lg border border-subtle bg-canvas text-sm"
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            disabled={savingFormula || !newFormula.metricId || !newFormula.formula}
                            onClick={createKpiFormulaVersion}
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-primary text-white disabled:opacity-50"
                        >
                            {savingFormula ? 'Saving...' : 'Save Formula Version'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-card border border-subtle rounded-xl p-4 space-y-3 max-h-[70vh] overflow-auto">
                    {decisions.length === 0 && (
                        <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-sm font-medium">
                            No decision alerts for this period.
                        </div>
                    )}

                    {decisions.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => selectDecision(item.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedDecision?.id === item.id ? 'border-brand-primary/40 bg-brand-light/60' : 'border-subtle hover:bg-canvas'}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-primary">{item.metric}</p>
                                <span className={`text-[11px] px-2 py-0.5 rounded border ${signalClassMap[item.signal]}`}>{item.signal}</span>
                            </div>
                            <p className="text-xs text-secondary mt-1">Current: {item.currentValue} | Previous: {item.previousValue}</p>
                        </button>
                    ))}
                </div>

                <div className="xl:col-span-2 bg-card border border-subtle rounded-xl p-4">
                    {!selectedDecision && (
                        <div className="p-6 text-secondary text-sm">Select a decision card to see drilldown details.</div>
                    )}

                    {selectedDecision && (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="text-lg font-bold text-primary">{drilldown?.title || selectedDecision.metric}</h4>
                                    <p className="text-sm text-secondary mt-1">Action: {selectedDecision.recommendedAction}</p>
                                </div>
                                <Link
                                    to={selectedDecision.actionLink}
                                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white"
                                >
                                    Take Action
                                </Link>
                            </div>

                            {loadingDrilldown && (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                            )}

                            {!loadingDrilldown && drilldown && (
                                <div className="overflow-auto border border-subtle rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-elevated text-xs uppercase tracking-wider text-secondary">
                                            <tr>
                                                {drilldown.columns.map((column) => (
                                                    <th key={column.key} className="text-left px-4 py-3 font-semibold">{column.label}</th>
                                                ))}
                                                <th className="text-left px-4 py-3 font-semibold">Record</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-subtle">
                                            {drilldown.rows.length === 0 && (
                                                <tr>
                                                    <td colSpan={drilldown.columns.length + 1} className="px-4 py-6 text-center text-secondary">
                                                        No records found for this decision.
                                                    </td>
                                                </tr>
                                            )}
                                            {drilldown.rows.map((row, index) => (
                                                <tr key={row.id || index} className="hover:bg-canvas/50">
                                                    {drilldown.columns.map((column) => (
                                                        <td key={`${row.id || index}-${column.key}`} className="px-4 py-3 text-primary">
                                                            {String(row[column.key] ?? '-')}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3">
                                                        {row.actionLink ? (
                                                            <Link to={row.actionLink} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">
                                                                <ListTree className="h-3.5 w-3.5" />
                                                                Open
                                                            </Link>
                                                        ) : (
                                                            <span className="text-xs text-muted">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-status-warning flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Use the decision table to inspect the exact records causing each signal before executing the action.
            </div>
        </div>
    );
};

export default DecisionBoard;
