import React from 'react';

export interface ColumnDef<T> {
 header: string;
 accessorKey?: keyof T;
 cell?: (item: T) => React.ReactNode;
 className?: string; // e.g., 'text-right'
}

interface ReadOnlyTableProps<T> {
 title: string;
 description?: string;
 icon?: React.ReactNode;
 data: T[];
 columns: ColumnDef<T>[];
 isLoading?: boolean;
 emptyMessage?: string;
}

export function ReadOnlyTable<T>({ title, description, icon, data, columns, isLoading, emptyMessage = 'No data found.' }: ReadOnlyTableProps<T>) {
 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
 {icon}
 {title}
 <span className="ml-3 px-2 py-1 bg-elevated text-secondary rounded-md text-xs font-semibold uppercase tracking-wider border border-subtle">
 View Only
 </span>
 </h2>
 {description && <p className="text-secondary">{description}</p>}
 </div>
 </div>

 <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-subtle">
 <table className="min-w-full divide-y divide-subtle">
 <thead className="bg-elevated">
 <tr>
 {columns.map((col, idx) => (
 <th key={idx} className={`px-6 py-3 text-left text-xs font-medium text-secondary uppercase ${col.className || ''}`}>
 {col.header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-subtle">
 {isLoading ? (
 <tr><td colSpan={columns.length} className="text-center py-8 text-secondary">Loading...</td></tr>
 ) : data.length === 0 ? (
 <tr><td colSpan={columns.length} className="text-center py-8 text-secondary">{emptyMessage}</td></tr>
 ) : (
 data.map((row, rowIdx) => (
 <tr key={rowIdx} className="hover:bg-elevated/50">
 {columns.map((col, colIdx) => (
 <td key={colIdx} className={`px-6 py-4 ${col.className || ''}`}>
 {col.cell ? col.cell(row) : (col.accessorKey ? row[col.accessorKey] as React.ReactNode : null)}
 </td>
 ))}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
}
