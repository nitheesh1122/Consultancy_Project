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
                    "flex h-10 w-full min-h-[44px] rounded-lg border border-subtle bg-card px-3.5 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
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
