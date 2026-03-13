import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';

const RFQList = () => {
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRFQs();
    }, []);

    const fetchRFQs = async () => {
        try {
            const { data } = await api.get('/supplier/my-rfq');
            setRfqs(data);
        } catch (error) {
            console.error('Error fetching RFQs', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="border-b border-subtle pb-6">
                <h1 className="text-2xl font-bold font-heading text-primary tracking-tight">Request for Quotations</h1>
                <p className="text-secondary mt-1 text-sm">View and respond to RFQs</p>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-secondary bg-canvas uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">RFQ Number</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Due Date</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rfqs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-secondary italic">No RFQs available</td></tr>
                            ) : rfqs.map((rfq: any) => (
                                <tr key={rfq._id} className="hover:bg-canvas transition-colors">
                                    <td className="px-6 py-4 font-semibold text-primary font-mono">{rfq.rfqNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {rfq.items.map((item: any, idx: number) => (
                                                <p key={idx} className="text-xs text-secondary">
                                                    {item.materialId?.name || 'Material'} — {item.quantity} {item.unit}
                                                </p>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-secondary">{rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={rfq.status === 'OPEN' ? 'warning' : 'info'}>{rfq.status}</StatusBadge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link to={`/supplier/rfq/${rfq._id}`}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                                            Submit Quote
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RFQList;
