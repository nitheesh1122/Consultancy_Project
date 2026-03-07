import React from 'react';
import { Check } from 'lucide-react';
import { cn } from './ui/Button';

export type PipelineStep = 'Requested' | 'Issued' | 'Raised' | 'Approved' | 'Completed';

const STEPS: PipelineStep[] = ['Requested', 'Issued', 'Raised', 'Approved', 'Completed'];

interface PipelineProps {
 currentStep: PipelineStep;
 className?: string;
}

export const Pipeline: React.FC<PipelineProps> = ({ currentStep, className }) => {
 const currentIndex = STEPS.indexOf(currentStep);

 return (
 <div className={cn("w-full py-4", className)}>
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative">
 <div className="hidden sm:block absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 -translate-y-1/2" />
 <div className="block sm:hidden absolute top-0 left-4 w-0.5 h-full bg-border -z-10" />

 {STEPS.map((step, index) => {
 const isCompleted = index < currentIndex;
 const isActive = index === currentIndex;
 const isPending = index > currentIndex;

 return (
 <div key={step} className="flex sm:flex-col items-center gap-4 sm:gap-2 relative mb-6 sm:mb-0">
 {/* Circle */}
 <div
 className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 shrink-0",
 isCompleted ? "bg-success border-success text-primary" :
 isActive ? "bg-primary border-primary text-white shadow-md" :
 "bg-surface border-border text-muted"
 )}
 >
 {isCompleted ? (
 <Check className="w-5 h-5 animate-in zoom-in" />
 ) : isActive ? (
 <div className="w-3 h-3 bg-black rounded-full animate-pulse-fast" />
 ) : (
 <span className="text-xs font-mono">{index + 1}</span>
 )}
 </div>

 {/* Label */}
 <span
 className={cn(
 "text-sm font-semibold tracking-wide uppercase",
 isCompleted ? "text-success" :
 isActive ? "text-primary" :
 "text-muted"
 )}
 >
 {step}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 );
};
