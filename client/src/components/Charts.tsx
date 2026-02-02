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

export const SimpleBarChart = ({ data, xKey, yKey, color = '#64748b', name }: any) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                    dataKey={xKey}
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} name={name} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const SimpleLineChart = ({ data, xKey, lines }: any) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                    dataKey={xKey}
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    padding={{ left: 10, right: 10 }}
                />
                <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                {lines.map((line: any) => (
                    <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        stroke={line.color}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        name={line.name}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};
