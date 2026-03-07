import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { FileText, Check, AlertCircle, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PDFDownloadButton from '../components/PDFDownloadButton';

interface MRSItem {
    _id: string;
    materialId: { _id: string; name: string; unit: string; quantity: number };
    quantityRequested: number;
    quantityIssued: number;
}

interface MRS {
    _id: string;
    batchId: string;
    supervisorId: { username: string };
    status: string;
    items: MRSItem[];
    createdAt: string;
}

const MRSList = () => {
    const [requests, setRequests] = useState<MRS[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const { user } = useAuth();

    // State for Issue Modal
    const [selectedMRS, setSelectedMRS] = useState<MRS | null>(null);
    const [issueQuantities, setIssueQuantities] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        fetchMRS();
    }, [activeTab]);

    const fetchMRS = async () => {
        setLoading(true);
        try {
            let endpoint = '/mrs/pending';
            if (user?.role === 'SUPERVISOR') {
                endpoint = '/mrs/my';
            } else if (activeTab === 'HISTORY') {
                endpoint = '/mrs/history';
            }
            const { data } = await api.get(endpoint);
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch MRS', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIssueClick = (mrs: MRS) => {
        setSelectedMRS(mrs);
        // Initialize issue quantities with remaining amount
        const initialQuantities: any = {};
        mrs.items.forEach(item => {
            initialQuantities[item.materialId._id] = item.quantityRequested - item.quantityIssued;
        });
        setIssueQuantities(initialQuantities);
    };

    const handleIssueSubmit = async () => {
        if (!selectedMRS) return;

        try {
            const itemsIssue = Object.keys(issueQuantities).map(matId => ({
                materialId: matId,
                quantityIssued: Number(issueQuantities[matId])
            })).filter(i => i.quantityIssued > 0);

            await api.put(`/mrs/${selectedMRS._id}/issue`, { itemsIssue });

            setSelectedMRS(null);
            fetchMRS(); // Refresh list
            alert('Materials Issued Successfully');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to issue materials');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary flex items-center">
                    <FileText className="mr-2 h-6 w-6 text-primary" />
                    {user?.role === 'SUPERVISOR' ? 'My Material Requests' : 'Material Requests'}
                </h2>

                {user?.role !== 'SUPERVISOR' && (
                    <div className="flex bg-surface-highlight p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('PENDING')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'PENDING'
                                ? 'bg-surface text-primary shadow-sm'
                                : 'text-secondary hover:text-primary'
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'HISTORY'
                                ? 'bg-surface text-primary shadow-sm'
                                : 'text-secondary hover:text-primary'
                                }`}
                        >
                            History
                        </button>
                    </div>
                )}
            </div>

            {loading ? <p className="text-secondary">Loading requests...</p> : (
                <div className="grid gap-6">
                    {requests.length === 0 ? (
                        <div className="text-center bg-surface border border-border rounded-lg py-16 px-6 text-secondary shadow-sm">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted" />
                            <h3 className="text-lg font-semibold text-primary mb-1">No Material Requests Found</h3>
                            <p className="text-sm max-w-sm mx-auto">
                                {user?.role === 'SUPERVISOR'
                                    ? "You haven't made any material requests yet."
                                    : activeTab === 'PENDING'
                                        ? "There are no pending requests waiting to be issued right now."
                                        : "There are no historical material requests to display."}
                            </p>
                        </div>
                    ) : (
                        requests.map((mrs) => (
                            <div key={mrs._id} className="bg-surface rounded-lg shadow border border-border overflow-hidden">
                                <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary">Batch: {mrs.batchId}</h3>
                                        <p className="text-sm text-secondary">
                                            Requested by <span className="font-medium text-primary">{mrs.supervisorId?.username || 'Unknown'}</span> on {new Date(mrs.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
 ${mrs.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            mrs.status === 'PARTIALLY_ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {mrs.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <table className="min-w-full divide-y divide-border mb-4">
                                        <thead>
                                            <tr>
                                                <th className="text-left text-xs font-medium text-secondary uppercase">Material</th>
                                                <th className="text-right text-xs font-medium text-secondary uppercase">Requested</th>
                                                <th className="text-right text-xs font-medium text-secondary uppercase">Issued</th>
                                                <th className="text-right text-xs font-medium text-secondary uppercase">Pending</th>
                                                {user?.role !== 'SUPERVISOR' && <th className="text-right text-xs font-medium text-secondary uppercase">Current Stock</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {mrs.items.map((item) => (
                                                <tr key={item._id}>
                                                    <td className="py-2 text-sm text-primary">{item.materialId?.name || 'Unknown'}</td>
                                                    <td className="py-2 text-sm text-right font-medium">{item.quantityRequested} {item.materialId?.unit}</td>
                                                    <td className="py-2 text-sm text-right text-success">{item.quantityIssued}</td>
                                                    <td className="py-2 text-sm text-right text-danger">{item.quantityRequested - item.quantityIssued}</td>
                                                    {user?.role !== 'SUPERVISOR' && (
                                                        <td className="py-2 text-sm text-right text-secondary">
                                                            {item.materialId?.quantity} (Stock)
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {user?.role !== 'SUPERVISOR' && mrs.status !== 'ISSUED' && mrs.status !== 'REJECTED' && activeTab === 'PENDING' && (
                                        <div className="flex justify-end mt-4">
                                            <button
                                                onClick={() => handleIssueClick(mrs)}
                                                className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-hover flex items-center"
                                            >
                                                <Check className="w-4 h-4 mr-2" /> Issue Materials
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Issue Dialog/Modal Simplified */}
            {selectedMRS && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Issue Materials for {selectedMRS.batchId}</h3>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {selectedMRS.items.map(item => {
                                const pending = item.quantityRequested - item.quantityIssued;
                                if (pending <= 0) return null;

                                return (
                                    <div key={item._id} className="grid grid-cols-3 gap-4 items-center">
                                        <div className="col-span-1">
                                            <p className="font-medium text-sm">{item.materialId.name}</p>
                                            <p className="text-xs text-secondary">Stock: {item.materialId.quantity} {item.materialId.unit}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-secondary block" htmlFor={`issue-qty-${item.materialId._id}`}>Issue Qty (Pending: {pending})</label>
                                            <input
                                                id={`issue-qty-${item.materialId._id}`}
                                                type="number"
                                                max={Math.min(pending, item.materialId.quantity)}
                                                value={issueQuantities[item.materialId._id]}
                                                onChange={(e) => setIssueQuantities({ ...issueQuantities, [item.materialId._id]: parseFloat(e.target.value) })}
                                                className="w-full border rounded p-2 text-sm"
                                                aria-label={`Issue quantity for ${item.materialId.name}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedMRS(null)}
                                className="px-4 py-2 text-secondary hover:bg-surface-highlight rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIssueSubmit}
                                className="px-4 py-2 bg-green-600 text-primary rounded hover:bg-green-700"
                            >
                                Confirm Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MRSList;
