import React from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

const AttendanceTracker = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <CalendarDays className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Worker Attendance Tracking</h2>
                <p className="text-gray-500 max-w-lg mx-auto mb-6">
                    Manage daily clock-ins, shift adherence, and absenteeism tracking for the production floor workforce.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                    <Clock3 className="h-4 w-4" /> Shift Log Connected
                </div>
            </div>
        </div>
    );
};

export default AttendanceTracker;
