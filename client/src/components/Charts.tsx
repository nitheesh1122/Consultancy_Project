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
