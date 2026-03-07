import React from 'react';
import { cn } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
 title: string;
 description: string;
 icon?: React.ReactNode;
 action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
 ({ title, description, icon, action, className, ...props }, ref) => {
 return (
 <div
 ref={ref}
 className={cn(
 "flex flex-col items-center justify-center p-8 text-center bg-card border border-subtle border-dashed rounded-lg",
 className
 )}
 {...props}
 >
 {icon && <div className="mb-4 text-muted [&>svg]:h-12 [&>svg]:w-12">{icon}</div>}
 <h3 className="text-lg font-heading text-primary">{title}</h3>
 <p className="mt-2 text-sm text-secondary max-w-sm">{description}</p>
 {action && <div className="mt-6">{action}</div>}
 </div>
 )
 }
)
EmptyState.displayName = "EmptyState"
