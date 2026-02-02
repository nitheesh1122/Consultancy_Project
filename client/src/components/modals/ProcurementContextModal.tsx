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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 font-heading">Material Information</h2>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Procurement Context</p>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 min-h-[200px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                    <div className="h-6 w-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                                    <span className="text-sm">Loading context...</span>
                                </div>
                            ) : error ? (
                                <div className="text-center text-rose-500 py-8 text-sm">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    {error}
                                </div>
                            ) : data ? (
                                <div className="space-y-6">
                                    {/* A. Material Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{data.material.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                                                    {data.material.category}
                                                </span>
                                                {data.material.code && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                                        <Hash className="h-3 w-3" /> {data.material.code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* B & C. Procurement Status & Snapshot */}
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                                            <Truck className="h-3 w-3" /> Last Inward Entry
                                        </h4>

                                        {data.status === 'ORDERED_BEFORE' && data.lastInward ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Supplier</span>
                                                    <span className="font-semibold text-slate-900">{data.lastInward.supplierName}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Inward Date</span>
                                                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                        {new Date(data.lastInward.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Quantity</span>
                                                    <span className="font-semibold text-slate-900">{data.lastInward.quantity} {data.material.unit}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 mt-2">
                                                    <span className="text-slate-500 text-xs">PI Reference</span>
                                                    <span className="font-mono text-xs text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                        #{data.lastInward.piRef}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <span className="block text-slate-400 text-sm mb-1">✖ Never Ordered</span>
                                                <p className="text-xs text-slate-500 italic">This material has not been procured through the system yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* D. Contextual Note */}
                                    {data.contextNote && (
                                        <div className="flex gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-800 text-sm">
                                            <Info className="h-5 w-5 shrink-0 text-amber-600" />
                                            <p className="leading-snug">{data.contextNote}</p>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <Button onClick={onClose} variant="secondary" size="sm">
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProcurementContextModal;
