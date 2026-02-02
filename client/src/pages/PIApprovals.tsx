import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { CheckCircle, XCircle, ShoppingCart } from 'lucide-react';

interface PIItem {
    _id: string;
    materialId: { name: string; unit: string };
    quantity: number;
}

interface PI {
    _id: string;
    storeManagerId: { username: string };
    status: 'RAISED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    reason: string;
    items: PIItem[];
    createdAt: string;
    supplierId?: { name: string };
}

const PIApprovals = () => {
    const [pis, setPis] = useState<PI[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPIs();
    }, []);

    const fetchPIs = async () => {
        try {
            const { data } = await api.get('/pi');
            setPis(data);
        } catch (error) {
            console.error('Failed to fetch PIs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;

        try {
            await api.put(`/pi/${id}/status`, { status });
            fetchPIs(); // Refresh list
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <ShoppingCart className="mr-2 h-6 w-6 text-indigo-600" />
                Product Inward Approvals
            </h2>

            {loading ? <p>Loading...</p> : (
                <div className="grid gap-6">
                    {pis.map((pi) => (
                        <div key={pi._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Raised by {pi.storeManagerId?.username} {pi.supplierId ? `for ${pi.supplierId.name}` : ''}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(pi.createdAt).toLocaleDateString()} - <span className="italic">{pi.reason || 'No specific reason'}</span>
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                  ${pi.status === 'RAISED' ? 'bg-yellow-100 text-yellow-800' :
                                        pi.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            pi.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                    {pi.status}
                                </span>
                            </div>
                            <div className="p-6">
                                <table className="min-w-full divide-y divide-gray-200 mb-4">
                                    <thead>
                                        <tr>
                                            <th className="text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                            <th className="text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pi.items.map((item) => (
                                            <tr key={item._id}>
                                                <td className="py-2 text-sm text-gray-900">{item.materialId?.name}</td>
                                                <td className="py-2 text-sm text-right font-medium">{item.quantity} {item.materialId?.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {pi.status === 'RAISED' && (
                                    <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                                        <button
                                            onClick={() => handleStatusUpdate(pi._id, 'REJECTED')}
                                            className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm font-medium"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(pi._id, 'APPROVED')}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {pis.length === 0 && <p className="text-center text-gray-500">No PI requests found.</p>}
                </div>
            )}
        </div>
    );
};

export default PIApprovals;
