import React from 'react';
import { CheckCircle, Clock, AlertCircle, PlayCircle } from 'lucide-react';

interface RequestTimelineProps {
    status: string;
    createdAt: string;
    completedAt?: string;
}

const RequestTimeline: React.FC<RequestTimelineProps> = ({ status, createdAt, completedAt }) => {
    const steps = [
        { id: 'PENDING', label: 'Requested', icon: Clock },
        { id: 'APPROVED', label: 'Approved', icon: PlayCircle }, // Assuming 'APPROVED' is a step before ISSUED or similar? 
        // Actually typical MRS flow: PENDING -> APPROVED -> ISSUED (Completed)
        // Or PENDING -> ISSUED directly? The current status seems to vary. 
        // Let's assume PENDING -> ISSUED. Or maybe PENDING -> APPROVED -> ISSUED.
        // Checking MRS statuses... 'PENDING', 'APPROVED', 'ISSUED', 'REJECTED'.
        { id: 'ISSUED', label: 'Issued', icon: CheckCircle },
    ];

    // Determine current step index
    let currentStepIndex = 0;
    if (status === 'APPROVED') currentStepIndex = 1;
    else if (status === 'ISSUED') currentStepIndex = 2;
    else if (status === 'REJECTED') currentStepIndex = -1; // Special case

    if (status === 'REJECTED') {
        return (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-2 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span className="font-bold text-sm">Request Rejected</span>
            </div>
        );
    }

    return (
        <div className="flex items-center w-full max-w-sm">
            {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                    <React.Fragment key={step.id}>
                        {/* Step Circle */}
                        <div className="relative flex flex-col items-center group">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                                ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-300 text-slate-300'}
                            `}>
                                <step.icon className="h-4 w-4" />
                            </div>
                            <div className="absolute top-10 w-max text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-sm border border-slate-100 z-10">
                                {step.label}
                                {index === 0 && <span className="block text-[10px] font-normal text-slate-400">{new Date(createdAt).toLocaleDateString()}</span>}
                                {index === 2 && completedAt && <span className="block text-[10px] font-normal text-slate-400">{new Date(completedAt).toLocaleDateString()}</span>}
                            </div>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 rounded-full ${index < currentStepIndex ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default RequestTimeline;
