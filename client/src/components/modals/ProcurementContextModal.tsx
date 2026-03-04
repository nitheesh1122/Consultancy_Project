import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Calendar, FileText, AlertCircle, Info, Hash } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../ui/Button';

interface ProcurementContextModalProps {
 isOpen: boolean;
 onClose: () => void;
 materialId: string | null;
}

interface ContextData {
 material: {
 name: string;
 code: string;
 category: string;
 quantity: number;
 minStock: number;
 unit: string;
 };
 status: 'ORDERED_BEFORE' | 'NEVER_ORDERED';
 lastInward: {
 date: string;
 quantity: number;
 supplierName: string;
 piRef: string;
 } | null;
 contextNote: string;
}

import { Modal } from '../ui/Modal';

// ... imports and interfaces above remain the same

const ProcurementContextModal: React.FC<ProcurementContextModalProps> = ({ isOpen, onClose, materialId }) => {
 const [data, setData] = useState<ContextData | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
 if (isOpen && materialId) {
 fetchContext();
 } else {
 setData(null);
 setError('');
 }
 }, [isOpen, materialId]);

 const fetchContext = async () => {
 setLoading(true);
 setError('');
 try {
 const res = await api.get(`/materials/${materialId}/procurement-context`);
 setData(res.data);
 } catch (err: any) {
 setError(err.response?.data?.message || 'Failed to load details');
 } finally {
 setLoading(false);
 }
 };

 return (
 <Modal isOpen={isOpen} onClose={onClose} title="Material Information" className="max-w-2xl">
 <div className="min-h-[200px]">
 {loading ? (
 <div className="flex flex-col items-center justify-center py-8 text-secondary">
 <div className="h-6 w-6 border-2 border-border border-t-primary rounded-full animate-spin mb-2"></div>
 <span className="text-sm">Loading context...</span>
 </div>
 ) : error ? (
 <div className="text-center text-danger py-8 text-sm">
 <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
 {error}
 </div>
 ) : data ? (
 <div className="space-y-6">
 {/* A. Material Header */}
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-bold font-heading text-primary text-xl">{data.material.name}</h3>
 <div className="flex gap-2 mt-2">
 <span className="px-2 py-0.5 bg-surface-highlight text-secondary border border-border text-[10px] font-bold rounded uppercase tracking-wider">
 {data.material.category}
 </span>
 {data.material.code && (
 <span className="px-2 py-0.5 bg-surface-highlight text-secondary border border-border text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1 font-mono">
 <Hash className="h-3 w-3" /> {data.material.code}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* B & C. Procurement Status & Snapshot */}
 <div className="bg-surface-highlight/30 rounded-lg p-5 border border-border">
 <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
 <Truck className="h-4 w-4 text-primary" /> Last Inward Entry
 </h4>

 {data.status === 'ORDERED_BEFORE' && data.lastInward ? (
 <div className="space-y-3">
 <div className="flex justify-between items-center text-sm">
 <span className="text-secondary">Supplier</span>
 <span className="font-semibold text-primary">{data.lastInward.supplierName}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-secondary">Inward Date</span>
 <span className="font-semibold text-primary flex items-center gap-1">
 <Calendar className="h-3 w-3 text-muted" />
 {new Date(data.lastInward.date).toLocaleDateString()}
 </span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-secondary">Quantity</span>
 <span className="font-semibold text-primary font-mono">{data.lastInward.quantity} {data.material.unit}</span>
 </div>
 <div className="flex justify-between items-center text-sm pt-3 border-t border-border mt-3">
 <span className="text-secondary text-xs">PI Reference</span>
 <span className="font-mono text-xs text-primary bg-surface px-1.5 py-0.5 rounded border border-border">
 #{data.lastInward.piRef}
 </span>
 </div>
 </div>
 ) : (
 <div className="text-center py-6">
 <span className="block text-muted text-sm mb-2">✖ Never Ordered</span>
 <p className="text-xs text-secondary italic">This material has not been procured through the system yet.</p>
 </div>
 )}
 </div>

 {/* D. Contextual Note */}
 {data.contextNote && (
 <div className="flex gap-3 bg-warning/10 p-4 rounded-lg border border-warning/20 text-warning text-sm">
 <Info className="h-5 w-5 shrink-0 text-warning" />
 <p className="leading-snug">{data.contextNote}</p>
 </div>
 )}
 </div>
 ) : null}
 </div>

 <div className="mt-6 flex justify-end">
 <Button onClick={onClose} variant="secondary">
 Acknowledge
 </Button>
 </div>
 </Modal>
 );
};

export default ProcurementContextModal;
