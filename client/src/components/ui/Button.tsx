import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

        const variants = {
            primary: 'bg-brand-primary text-white font-medium hover:bg-brand-hover transition-all',
            secondary: 'bg-elevated border border-subtle text-primary hover:bg-card transition-all',
            outline: 'border border-subtle bg-transparent hover:bg-elevated text-primary',
            ghost: 'hover:bg-elevated text-secondary hover:text-primary transition-colors',
            danger: 'bg-status-danger/10 text-status-danger border border-status-danger/20 hover:bg-status-danger/20 transition-colors',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2.5',
            lg: 'h-12 px-8 text-lg',
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button, cn };
