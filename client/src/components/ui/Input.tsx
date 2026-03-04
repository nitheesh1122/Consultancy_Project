import React, { forwardRef } from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    isMonospace?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, isMonospace, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full min-h-[44px] rounded-md border border-subtle bg-card px-3 py-2 text-sm text-primary transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-1 focus-visible:ring-brand-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
                    isMonospace && "font-mono font-medium tabular-nums",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
