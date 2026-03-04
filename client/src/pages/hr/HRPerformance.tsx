import React from 'react';
import { BarChart3, TrendingUp, Filter } from 'lucide-react';

const HRPerformance = () => {
 return (
 <div className="space-y-6 animate-fade-in">
 <div className="bg-surface rounded-xl shadow-sm border border-border p-8 text-center">
 <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
 <TrendingUp className="h-8 w-8 text-primary" />
 </div>
 <h2 className="text-xl font-bold text-primary mb-2">Worker Performance Dashboard</h2>
 <p className="text-secondary max-w-lg mx-auto mb-6">
 Connects with the 4-Way Analytics split to provide detailed HR KPIs, historical yield tracking, and worker efficiency trends.
 </p>
 <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm">
 <BarChart3 className="h-4 w-4" /> Analytics Engine Connected
 </div>
 </div>
 </div>
 );
};

export default HRPerformance;
