import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    ComposedChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    ZAxis,
    Legend,
    ReferenceLine,
} from 'recharts';

export const SimpleBarChart = ({ data, xKey, yKey, color = 'var(--color-primary)', name }: any) => {
 return (
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id={`color-${yKey}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={color} stopOpacity={0.8} />
 <stop offset="95%" stopColor={color} stopOpacity={0.2} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
 <XAxis
 dataKey={xKey}
 stroke="var(--text-secondary)"
 fontSize={12}
 tickLine={false}
 axisLine={false}
 fontFamily="Space Grotesk, sans-serif"
 />
 <YAxis
 stroke="var(--text-secondary)"
 fontSize={12}
 tickLine={false}
 axisLine={false}
 fontFamily="JetBrains Mono, monospace"
 />
 <Tooltip
 cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
 contentStyle={{
 borderRadius: '8px',
 border: '1px solid var(--border-color)',
 boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
 backgroundColor: 'var(--bg-card)',
 color: 'var(--text-primary)'
 }}
 itemStyle={{
 fontFamily: 'JetBrains Mono, monospace'
 }}
 />
 <Bar dataKey={yKey} fill={`url(#color-${yKey})`} radius={[4, 4, 0, 0]} name={name} />
 </BarChart>
 </ResponsiveContainer>
 );
};

export const SimpleLineChart = ({ data, xKey, lines }: any) => {
 return (
 <ResponsiveContainer width="100%" height={300}>
 <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
 <XAxis
 dataKey={xKey}
 stroke="var(--text-secondary)"
 fontSize={12}
 tickLine={false}
 axisLine={false}
 padding={{ left: 10, right: 10 }}
 fontFamily="Space Grotesk, sans-serif"
 />
 <YAxis
 stroke="var(--text-secondary)"
 fontSize={12}
 tickLine={false}
 axisLine={false}
 fontFamily="JetBrains Mono, monospace"
 />
 <Tooltip
 contentStyle={{
 borderRadius: '8px',
 border: '1px solid var(--border-color)',
 boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
 backgroundColor: 'var(--bg-card)',
 color: 'var(--text-primary)'
 }}
 itemStyle={{
 fontFamily: 'JetBrains Mono, monospace'
 }}
 />
 {lines.map((line: any, index: number) => (
 <Line
 key={line.key}
 type="monotone"
 dataKey={line.key}
 stroke={line.color || (index === 0 ? 'var(--color-primary)' : 'var(--color-secondary)')}
 strokeWidth={3}
 dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }}
 activeDot={{ r: 6, stroke: 'var(--color-primary-hover)' }}
 name={line.name}
         />
        ))}
        </LineChart>
        </ResponsiveContainer>
    );
};

// ── Tooltip shared style ──────────────────────────────────────────────────────
const tooltipStyle = {
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
};

// ── Gauge Chart (half-donut) ──────────────────────────────────────────────────
export const GaugeChart = ({
    value,
    label,
    color = '#d4a853',
    max = 100,
}: {
    value: number;
    label: string;
    color?: string;
    max?: number;
}) => {
    const pct = Math.min(Math.max(value / max, 0), 1);
    const data = [
        { v: pct * 100, fill: color },
        { v: (1 - pct) * 100, fill: 'rgba(255,255,255,0.06)' },
    ];
    return (
        <div className="relative flex flex-col items-center" style={{ height: 120 }}>
            <PieChart width={160} height={90}>
                <Pie
                    data={data}
                    cx={80}
                    cy={80}
                    startAngle={180}
                    endAngle={0}
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="v"
                    paddingAngle={1}
                    stroke="none"
                >
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                    ))}
                </Pie>
            </PieChart>
            <div className="absolute bottom-0 text-center select-none">
                <div className="text-2xl font-black font-mono tabular-nums leading-none" style={{ color }}>
                    {value}%
                </div>
                <div className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-0.5">{label}</div>
            </div>
        </div>
    );
};

// ── Shift Comparison Chart (grouped bars) ─────────────────────────────────────
export const ShiftComparisonChart = ({
    data,
}: {
    data: { shift: string; avgYield: number; rejectionRate: number; avgWastage: number }[];
}) => {
    const d = data.map(s => ({
        name: s.shift,
        Yield: s.avgYield ?? 0,
        Rejection: s.rejectionRate ?? 0,
        Wastage: s.avgWastage ?? 0,
    }));
    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={d} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} fontFamily="Space Grotesk, sans-serif" />
                <YAxis unit="%" tickLine={false} axisLine={false} fontSize={11} fontFamily="JetBrains Mono, monospace" />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }} formatter={(v: any) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' }} />
                <Bar dataKey="Yield" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rejection" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Wastage" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// ── Pareto Chart (sorted bar + cumulative % line) ─────────────────────────────
export const ParetoChart = ({
    data,
    valueLabel = 'Count',
}: {
    data: { name: string; value: number }[];
    valueLabel?: string;
}) => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, d) => s + d.value, 0);
    let cum = 0;
    const chartData = sorted.map(d => {
        cum += d.value;
        return { ...d, cumPct: total > 0 ? parseFloat(((cum / total) * 100).toFixed(1)) : 0 };
    });
    return (
        <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} fontFamily="Space Grotesk, sans-serif" />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={11} fontFamily="JetBrains Mono, monospace" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} fontSize={11} fontFamily="JetBrains Mono, monospace" />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <Bar yAxisId="left" dataKey="value" fill="#d4a853" radius={[4, 4, 0, 0]} name={valueLabel} />
                <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Cumulative %" />
                <ReferenceLine yAxisId="right" y={80} stroke="#f97316" strokeDasharray="5 5" strokeOpacity={0.5} />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

// ── Supplier Scatter Chart (rejection rate vs yield, bubble = batches) ─────────
export const SupplierScatterChart = ({
    data,
}: {
    data: { name: string; rejectionRate: number; avgYield: number; totalBatches: number }[];
}) => {
    const chartData = data.map(d => ({
        x: d.rejectionRate ?? 0,
        y: d.avgYield ?? 0,
        z: d.totalBatches ?? 1,
        name: d.name,
    }));
    return (
        <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="x" name="Rejection Rate" unit="%" type="number" domain={[0, 'auto']} fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Rejection Rate %', position: 'insideBottom', offset: -6, fontSize: 11 }} fontFamily="JetBrains Mono, monospace" />
                <YAxis dataKey="y" name="Avg Yield" unit="%" type="number" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} fontFamily="JetBrains Mono, monospace" />
                <ZAxis dataKey="z" range={[60, 500]} name="Batches" />
                <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={tooltipStyle}
                    content={({ payload }: any) => {
                        if (!payload?.length) return null;
                        const p = payload[0].payload;
                        const orig = data.find(d => d.rejectionRate === p.x && d.avgYield === p.y);
                        return (
                            <div style={tooltipStyle} className="p-3 text-xs font-mono">
                                <p className="font-bold text-primary mb-1">{orig?.name ?? 'Supplier'}</p>
                                <p>Rejection: <span className="text-status-danger">{p.x}%</span></p>
                                <p>Avg Yield: <span className="text-status-success">{p.y}%</span></p>
                                <p>Batches: {p.z}</p>
                            </div>
                        );
                    }}
                />
                <Scatter data={chartData} fill="#d4a853" opacity={0.8} />
            </ScatterChart>
        </ResponsiveContainer>
    );
};

// ── Yield Breakdown Bar (horizontal stacked 100%) ────────────────────────────
export const YieldBreakdownBar = ({
    batches,
}: {
    batches: { inputKg?: number; outputFirstGradeKg?: number; outputSecondGradeKg?: number; rejectionKg?: number }[];
}) => {
    const totalInput = batches.reduce((s, b) => s + (b.inputKg ?? 0), 0);
    if (totalInput <= 0) return null;
    const first = batches.reduce((s, b) => s + (b.outputFirstGradeKg ?? 0), 0);
    const second = batches.reduce((s, b) => s + (b.outputSecondGradeKg ?? 0), 0);
    const rejection = batches.reduce((s, b) => s + (b.rejectionKg ?? 0), 0);
    const unaccounted = Math.max(0, totalInput - first - second - rejection);
    const pct = (v: number) => parseFloat(((v / totalInput) * 100).toFixed(1));
    const d = [{
        name: 'Yield',
        'First Grade': pct(first),
        'Second Grade': pct(second),
        'Rejection': pct(rejection),
        'Unaccounted': pct(unaccounted),
    }];
    return (
        <ResponsiveContainer width="100%" height={72}>
            <BarChart data={d} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                    formatter={(v: any) => `${v}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Space Grotesk, sans-serif', marginTop: 4 }} />
                <Bar dataKey="First Grade" stackId="a" fill="#22c55e" />
                <Bar dataKey="Second Grade" stackId="a" fill="#84cc16" />
                <Bar dataKey="Rejection" stackId="a" fill="#ef4444" />
                <Bar dataKey="Unaccounted" stackId="a" fill="#6b7280" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// ── Composed Line+Bar: Bar series with MA overlay ─────────────────────────────
export const ComposedBarMAChart = ({
    data,
    xKey,
    barKey,
    barName = 'Value',
    barColor = '#d4a853',
    maPeriod = 3,
}: {
    data: any[];
    xKey: string;
    barKey: string;
    barName?: string;
    barColor?: string;
    maPeriod?: number;
}) => {
    const withMA = data.map((d, i) => {
        const window = data.slice(Math.max(0, i - maPeriod + 1), i + 1);
        const avg = window.reduce((s, x) => s + (x[barKey] ?? 0), 0) / window.length;
        return { ...d, movingAvg: parseFloat(avg.toFixed(0)) };
    });
    return (
        <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={withMA} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey={xKey} fontSize={12} tickLine={false} axisLine={false} fontFamily="Space Grotesk, sans-serif" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} fontFamily="JetBrains Mono, monospace" />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' }} />
                <Bar dataKey={barKey} fill={barColor} radius={[4, 4, 0, 0]} name={barName} opacity={0.7} />
                <Line type="monotone" dataKey="movingAvg" stroke="#f97316" strokeWidth={2.5} dot={false} name={`${maPeriod}-Period MA`} strokeDasharray="5 3" />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

// ── Category Distribution chart (stacked bar DYE vs CHEMICAL) ────────────────
export const CategoryBarChart = ({
    data,
}: {
    data: { name: string; DYE?: number; CHEMICAL?: number }[];
}) => (
    <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} fontFamily="Space Grotesk, sans-serif" />
            <YAxis tickLine={false} axisLine={false} fontSize={11} fontFamily="JetBrains Mono, monospace" />
            <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' }} />
            <Bar dataKey="DYE" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
            <Bar dataKey="CHEMICAL" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);
