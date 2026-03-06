import React from 'react';
import { Briefcase, Users } from 'lucide-react';

const WorkerAssignment = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-card rounded-xl shadow-sm border border-subtle p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                    <Briefcase className="h-8 w-8 text-brand-primary" />
                </div>
                <h2 className="text-xl font-bold font-heading text-primary mb-2">Worker Assignment</h2>
                <p className="text-secondary max-w-lg mx-auto mb-6">
                    Assign workers to specific machines, production batches, or factory floors dynamically.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-light/50 text-brand-primary rounded-lg font-medium text-sm">
                    <Users className="h-4 w-4" /> Assignment Board Loading...
                </div>
            </div>
        </div>
    );
};

export default WorkerAssignment;
