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
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

        const variants = {
            primary: 'bg-brand-primary text-white hover:bg-brand-hover shadow-sm',
            secondary: 'bg-elevated border border-subtle text-primary hover:bg-card hover:border-border-strong',
            outline: 'border border-subtle bg-transparent hover:bg-elevated text-primary',
            ghost: 'hover:bg-elevated text-secondary hover:text-primary',
            danger: 'bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger/15',
        };

        const sizes = {
            sm: 'h-9 px-3.5 text-xs rounded-md',
            md: 'h-10 px-4 text-sm rounded-lg',
            lg: 'h-11 px-6 text-base rounded-lg',
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className,
                    variant === 'primary' && '!text-white'
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
