import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Truck, CheckCircle, Package, History, FileText } from 'lucide-react';
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Truck className="mr-2 h-6 w-6 text-indigo-600" />
                    Inward Entry (Goods Receipt)
                </h2>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PENDING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pending Receipt
                    </button>
                    <button
                        onClick={() => setActiveTab('COMPLETED')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'COMPLETED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {loading ? <p className="text-center py-8 text-gray-500">Loading PIs...</p> : (
                <div className="grid gap-6">
                    {filteredPIs.length === 0 ? (
                        <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            {activeTab === 'PENDING' ? (
                                <>
                                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No Approved Orders Pending.</p>
                                    <p className="text-sm text-gray-400 mt-1">Wait for Admin to approve your PIs.</p>
                                </>
                            ) : (
                                <>
                                    <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No History yet.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredPIs.map((pi) => (
                            <div key={pi._id} className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden border-l-4 ${activeTab === 'PENDING' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
                                <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                PO #{pi._id.slice(-6).toUpperCase()}
                                            </h3>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${pi.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {pi.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {activeTab === 'PENDING' ? `Approved on ${new Date(pi.createdAt).toLocaleDateString()}` : `Received on ${new Date(pi.completedAt || pi.createdAt).toLocaleDateString()}`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <PDFDownloadButton
                                            type="PI"
                                            data={pi}
                                            fileName={activeTab === 'PENDING' ? `PO_${pi._id}.pdf` : `GRN_${pi._id}.pdf`}
                                        />

                                        {activeTab === 'PENDING' && (
                                            <button
                                                onClick={() => initiateInward(pi._id)}
                                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-bold shadow-sm transition-colors"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Receive & Rate
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Material</th>
                                                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {pi.items.map((item) => (
                                                <tr key={item._id}>
                                                    <td className="py-2 px-3 text-sm text-gray-900 font-medium">{item.materialId?.name}</td>
                                                    <td className="py-2 px-3 text-sm text-right font-bold text-gray-700">
                                                        {item.quantity} {item.materialId?.unit}
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
        </div>
    );
};

export default InwardEntry;
