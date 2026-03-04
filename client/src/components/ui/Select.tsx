import React, { forwardRef } from 'react';
import { cn } from './Button';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const Select = forwardRef<HTMLSelectElement, SelectProps>(
 ({ className, children, ...props }, ref) => {
 return (
 <select
 className={cn(
 "flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary transition-colors placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
 className
 )}
 ref={ref}
 {...props}
 >
 {children}
 </select>
 )
 }
)
Select.displayName = "Select"

export { Select }
