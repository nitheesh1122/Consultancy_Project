import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string;
    trendColor?: 'text-green-500' | 'text-red-500' | 'text-gray-500';
    color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, trend, trendColor, color = "text-gray-900" }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h3>
                    {trend && (
                        <p className={`text-xs mt-1 font-medium ${trendColor}`}>
                            {trend}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default KPICard;
