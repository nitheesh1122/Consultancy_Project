import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { FileText, Check, AlertCircle } from 'lucide-react';
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
    const { user } = useAuth();

    // State for Issue Modal
    const [selectedMRS, setSelectedMRS] = useState<MRS | null>(null);
    const [issueQuantities, setIssueQuantities] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        fetchMRS();
    }, []);

    const fetchMRS = async () => {
        try {
            const endpoint = user?.role === 'SUPERVISOR' ? '/mrs/my' : '/mrs/pending';
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
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <FileText className="mr-2 h-6 w-6 text-indigo-600" />
                {user?.role === 'SUPERVISOR' ? 'My Material Requests' : 'Pending Material Requests'}
            </h2>

            {loading ? <p>Loading...</p> : (
                <div className="grid gap-6">
                    {requests.map((mrs) => (
                        <div key={mrs._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Batch: {mrs.batchId}</h3>
                                    <p className="text-sm text-gray-500">
                                        Requested by <span className="font-medium text-gray-700">{mrs.supervisorId?.username || 'Unknown'}</span> on {new Date(mrs.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                ${mrs.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        mrs.status === 'PARTIALLY_ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                    {mrs.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="p-6">
                                <table className="min-w-full divide-y divide-gray-200 mb-4">
                                    <thead>
                                        <tr>
                                            <th className="text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                            <th className="text-right text-xs font-medium text-gray-500 uppercase">Requested</th>
                                            <th className="text-right text-xs font-medium text-gray-500 uppercase">Issued</th>
                                            <th className="text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                                            {user?.role !== 'SUPERVISOR' && <th className="text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {mrs.items.map((item) => (
                                            <tr key={item._id}>
                                                <td className="py-2 text-sm text-gray-900">{item.materialId?.name || 'Unknown'}</td>
                                                <td className="py-2 text-sm text-right font-medium">{item.quantityRequested} {item.materialId?.unit}</td>
                                                <td className="py-2 text-sm text-right text-green-600">{item.quantityIssued}</td>
                                                <td className="py-2 text-sm text-right text-red-600">{item.quantityRequested - item.quantityIssued}</td>
                                                {user?.role !== 'SUPERVISOR' && (
                                                    <td className="py-2 text-sm text-right text-gray-500">
                                                        {item.materialId?.quantity} (Stock)
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {user?.role !== 'SUPERVISOR' && mrs.status !== 'ISSUED' && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleIssueClick(mrs)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 flex items-center"
                                        >
                                            <Check className="w-4 h-4 mr-2" /> Issue Materials
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Issue Dialog/Modal Simplified */}
            {selectedMRS && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Issue Materials for {selectedMRS.batchId}</h3>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {selectedMRS.items.map(item => {
                                const pending = item.quantityRequested - item.quantityIssued;
                                if (pending <= 0) return null;

                                return (
                                    <div key={item._id} className="grid grid-cols-3 gap-4 items-center">
                                        <div className="col-span-1">
                                            <p className="font-medium text-sm">{item.materialId.name}</p>
                                            <p className="text-xs text-gray-500">Stock: {item.materialId.quantity} {item.materialId.unit}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 block">Issue Qty (Pending: {pending})</label>
                                            <input
                                                type="number"
                                                max={Math.min(pending, item.materialId.quantity)}
                                                value={issueQuantities[item.materialId._id]}
                                                onChange={(e) => setIssueQuantities({ ...issueQuantities, [item.materialId._id]: parseFloat(e.target.value) })}
                                                className="w-full border rounded p-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedMRS(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIssueSubmit}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
