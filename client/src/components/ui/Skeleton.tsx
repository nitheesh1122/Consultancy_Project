import React from 'react';
import { cn } from './Button';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
 return (
 <div
 className={cn("animate-pulse-fast rounded-md bg-surface-highlight", className)}
 {...props}
 />
 )
}

export { Skeleton }
