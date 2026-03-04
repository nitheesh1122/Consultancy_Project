import React, { useEffect } from 'react';
import { cn } from './Button';
import { X } from 'lucide-react';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'unset';
 }
 return () => { document.body.style.overflow = 'unset'; };
 }, [isOpen]);

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
 <div className={cn("industrial-card relative w-full max-w-lg z-10 animate-slide-up bg-surface", className)}>
 {title && (
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h2 className="text-xl font-heading font-semibold text-primary">{title}</h2>
 <button onClick={onClose} className="rounded-md p-1 hover:bg-surface-highlight text-secondary hover:text-primary transition-colors">
 <X className="h-5 w-5" />
 </button>
 </div>
 )}
 {!title && (
 <button onClick={onClose} className="absolute top-4 right-4 rounded-md p-1 hover:bg-surface-highlight text-secondary hover:text-primary transition-colors z-20">
 <X className="h-5 w-5" />
 </button>
 )}
 <div className="p-5">
 {children}
 </div>
 </div>
 </div>
 );
};
