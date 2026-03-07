import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Truck, CheckCircle, Package, History, FileText, Calendar } from 'lucide-react';
import PDFDownloadButton from '../components/PDFDownloadButton';

interface PIItem {
    _id: string;
    materialId: { name: string; unit: string };
    quantity: number;
}

interface PI {
    _id: string;
    storeManagerId: { username: string };
    status: string;
    items: PIItem[];
    createdAt: string;
    completedAt?: string;
    adminId?: { username: string };
    reason?: string;
}

const InwardEntry = () => {
    const [pis, setPis] = useState<PI[]>([]);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPIs();
    }, []);

    const fetchPIs = async () => {
        try {
            const { data } = await api.get('/pi');
            // We want both APPROVED (Pending Inward) and COMPLETED (History)
            setPis(data);
        } catch (error) {
            console.error('Failed to fetch PIs', error);
        } finally {
            setLoading(false);
        }
    };

    // Rating State
    const [ratingOpen, setRatingOpen] = useState(false);
    const [selectedPiId, setSelectedPiId] = useState<string | null>(null);
    const [rating, setRating] = useState(5);

    const initiateInward = (id: string) => {
        setSelectedPiId(id);
        setRating(5); // Reset to default
        setRatingOpen(true);
    };

    const handleProcessInward = async () => {
        if (!selectedPiId) return;

        try {
            await api.post(`/pi/${selectedPiId}/inward`, { rating }); // Send rating
            alert('Inward Entry Successful! Stock Updated & Supplier Rated.');
            setRatingOpen(false);
            setSelectedPiId(null);
            fetchPIs();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to process inward entry');
        }
    };

    const filteredPIs = pis.filter(pi => {
        if (activeTab === 'PENDING') return pi.status === 'APPROVED';
        if (activeTab === 'COMPLETED') return pi.status === 'COMPLETED';
        return false;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-subtle pb-4">
                <h2 className="text-2xl font-bold text-primary font-heading flex items-center">
                    <Truck className="mr-3 h-7 w-7 text-brand-primary" />
                    Inward Entry (Goods Receipt)
                </h2>
                <div className="flex space-x-2 bg-elevated p-1.5 rounded-lg border border-subtle relative">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'PENDING' ? 'bg-card text-brand-primary shadow-md' : 'text-secondary hover:text-primary'}`}
                    >
                        Pending Receipt
                    </button>
                    <button
                        onClick={() => setActiveTab('COMPLETED')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'COMPLETED' ? 'bg-card text-brand-primary shadow-md' : 'text-secondary hover:text-primary'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 border-2 border-subtle border-t-brand-primary rounded-full animate-spin"></div>
                    <p className="text-secondary ml-3 font-mono">Loading PIs...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredPIs.length === 0 ? (
                        <div className="text-center p-12 bg-canvas rounded-xl border-2 border-dashed border-subtle">
                            {activeTab === 'PENDING' ? (
                                <>
                                    <Package className="h-12 w-12 text-muted mx-auto mb-4" />
                                    <p className="text-primary font-heading font-bold text-lg">No Approved Orders Pending.</p>
                                    <p className="text-sm text-secondary mt-2">Wait for Admin to approve your Purchase Indents.</p>
                                </>
                            ) : (
                                <>
                                    <History className="h-12 w-12 text-muted mx-auto mb-4" />
                                    <p className="text-primary font-heading font-bold text-lg">No Inward History yet.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredPIs.map((pi) => (
                            <div key={pi._id} className={`bg-card rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl border-l-[6px] border-y border-r border-subtle ${activeTab === 'PENDING' ? 'border-l-status-info shadow-status-info/5' : 'border-l-status-success shadow-status-success/5'}`}>
                                <div className="px-6 py-4 border-b border-subtle flex flex-wrap justify-between items-center bg-canvas/50 gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-primary font-mono tracking-tight">
                                                PO #{pi._id.slice(-6).toUpperCase()}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-sm border ${pi.status === 'APPROVED' ? 'bg-status-info/10 text-status-info border-status-info/30' : 'bg-status-success/10 text-status-success border-status-success/30'}`}>
                                                {pi.status}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-secondary mt-1.5 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {activeTab === 'PENDING' ? `Approved on ${new Date(pi.createdAt).toLocaleDateString()}` : `Received on ${new Date(pi.completedAt || pi.createdAt).toLocaleDateString()}`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <PDFDownloadButton
                                            type="PI"
                                            data={pi}
                                            fileName={activeTab === 'PENDING' ? `PO_${pi._id}.pdf` : `GRN_${pi._id}.pdf`}
                                        />

                                        {activeTab === 'PENDING' && (
                                            <button
                                                onClick={() => initiateInward(pi._id)}
                                                className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 text-sm font-bold shadow-md transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Receive & Rate
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-canvas">
                                            <tr>
                                                <th className="text-left py-2 px-3 text-xs font-medium text-secondary uppercase">Material</th>
                                                <th className="text-right py-2 px-3 text-xs font-medium text-secondary uppercase">Quantity</th>
                                                <th className="py-3 px-6 text-xs font-bold text-secondary uppercase tracking-wider">Material</th>
                                                <th className="py-3 px-6 text-xs font-bold text-secondary uppercase tracking-wider text-right">Quantity Received</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-subtle">
                                            {pi.items.map((item) => (
                                                <tr key={item._id} className="hover:bg-canvas/50 transition-colors">
                                                    <td className="py-3 px-6 text-sm text-primary font-bold font-heading">{item.materialId?.name}</td>
                                                    <td className="py-3 px-6 text-sm text-right font-bold text-primary tabular-nums font-mono">
                                                        {item.quantity} <span className="text-xs text-muted ml-0.5">{item.materialId?.unit}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )))}
                </div>
            )}

            {/* Rating Modal */}
            {ratingOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 border border-subtle relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-brand-primary rounded-full opacity-10 blur-3xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-primary font-heading">Rate Supplier Performance</h3>
                            <button onClick={() => setRatingOpen(false)} className="text-muted hover:text-brand-primary transition-colors">
                                &times;
                            </button>
                        </div>

                        <p className="text-secondary text-sm mb-6 relative z-10">
                            How would you rate the quality and delivery timeliness for this order? Your feedback helps the "Supplier Details" scorecard.
                        </p>

                        <div className="flex justify-center space-x-3 mb-8 relative z-10">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-4xl transition-all hover:scale-110 drop-shadow-sm ${rating >= star ? 'text-brand-primary drop-shadow-[0_0_8px_rgba(212,168,83,0.5)]' : 'text-elevated hover:text-brand-primary/50'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setRatingOpen(false)}
                                className="px-4 py-2 border border-subtle rounded-md text-primary hover:bg-canvas"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessInward}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover font-bold shadow-sm"
                            >
                                Confirm & Process Inward
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InwardEntry;
