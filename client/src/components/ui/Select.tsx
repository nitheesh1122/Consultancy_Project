import React, { forwardRef } from 'react';
import { cn } from './Button';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const Select = forwardRef<HTMLSelectElement, SelectProps>(
 ({ className, children, ...props }, ref) => {
 return (
 <select
 className={cn(
 "flex h-10 w-full items-center justify-between rounded-lg border border-subtle bg-card px-3.5 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
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
