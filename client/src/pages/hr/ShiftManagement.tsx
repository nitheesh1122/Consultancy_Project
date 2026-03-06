import React from 'react';
import { CalendarClock, Clock } from 'lucide-react';

const ShiftManagement = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-card rounded-xl shadow-sm border border-subtle p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                    <CalendarClock className="h-8 w-8 text-brand-primary" />
                </div>
                <h2 className="text-xl font-bold font-heading text-primary mb-2">Shift Management</h2>
                <p className="text-secondary max-w-lg mx-auto mb-6">
                    Manage worker schedules, shifts, overtime, and shift adherence for factory operations.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-light/50 text-brand-primary rounded-lg font-medium text-sm">
                    <Clock className="h-4 w-4" /> Shift Scheduler Loading...
                </div>
            </div>
        </div>
    );
};

export default ShiftManagement;
