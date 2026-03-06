import React from 'react';
import { cn } from './Button';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> { }

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
    ({ className, ...props }, ref) => (
        <div className="relative w-full overflow-auto">
            <table
                ref={ref}
                className={cn("w-full caption-bottom text-sm", className)}
                {...props}
            />
        </div>
    )
)
Table.displayName = "Table"

export const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("bg-elevated text-secondary uppercase text-xs tracking-wider font-semibold", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
    />
))
TableBody.displayName = "TableBody"

export const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement> & { active?: boolean }
>(({ className, active, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            "border-b border-subtle hover:bg-elevated/50 even:bg-elevated/25 transition-colors duration-150",
            active && "bg-brand-primary/5 border-l-2 border-l-brand-primary",
            className
        )}
        {...props}
    />
))
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "h-12 px-4 text-left align-middle font-semibold text-secondary",
            className
        )}
        {...props}
    />
))
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement> & { isMonospace?: boolean; isStatus?: boolean }
>(({ className, isMonospace, isStatus, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            "py-1.5 px-2 align-middle text-primary",
            isMonospace && "font-mono tabular-nums",
            isStatus && "font-mono font-semibold border-l-2 border-l-brand-primary",
            className
        )}
        {...props}
    />
))
TableCell.displayName = "TableCell"
