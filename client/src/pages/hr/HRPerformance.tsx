import React from 'react';
import { BarChart3, TrendingUp, Filter } from 'lucide-react';

const HRPerformance = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Worker Performance Dashboard</h2>
                <p className="text-gray-500 max-w-lg mx-auto mb-6">
                    Connects with the 4-Way Analytics split to provide detailed HR KPIs, historical yield tracking, and worker efficiency trends.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm">
                    <BarChart3 className="h-4 w-4" /> Analytics Engine Connected
                </div>
            </div>
        </div>
    );
};

export default HRPerformance;
