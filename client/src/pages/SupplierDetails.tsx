import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import KPICard from '../components/KPICard';
import { SimpleLineChart } from '../components/Charts';

const SupplierDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/suppliers/${id}/analytics`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching supplier details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>Supplier not found</div>;

    const { supplier, metrics, history } = data;

    // Transform history for chart
    const chartData = [...history].reverse().map((h: any) => ({
        date: new Date(h.completedAt).toLocaleDateString(),
        delay: h.delayDays
    }));

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/suppliers')} className="flex items-center text-secondary hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Suppliers
            </button>

            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                <h1 className="text-2xl font-bold text-primary">{supplier.name}</h1>
                <div className="flex items-center text-sm text-secondary mt-1">
                    <span className="mr-4">Contact: {supplier.contactPerson} ({supplier.phone})</span>
                    <span>Status: {metrics.status}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard
                    title="Avg Delivery Time"
                    value={`${metrics.avgDeliveryTime} Days`}
                    icon={Clock}
                    status="info"
                />
                <KPICard
                    title="On-Time Rate"
                    value={`${metrics.onTimePercentage}%`}
                    icon={CheckCircle}
                    status="success"
                />
                <KPICard
                    title="Delayed Deliveries"
                    value={metrics.delayedCount}
                    icon={AlertCircle}
                    status={metrics.delayedCount > 0 ? "danger" : "neutral"}
                />
                <KPICard
                    title="Total Completed PIs"
                    value={metrics.totalCompletedPIs}
                    icon={CheckCircle}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-border h-96">
                    <h3 className="text-lg font-bold mb-4 text-primary">Delivery Delay Trend</h3>
                    <SimpleLineChart
                        data={chartData}
                        xKey="date"
                        lines={[{ key: 'delay', name: 'Delay (Days)', color: '#EF4444' }]}
                    />
                </div>

                <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-lg font-bold mb-4 text-primary">Recent History</h3>
                    <div className="overflow-auto max-h-80">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary">Date</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary">Delay (Days)</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-secondary">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h: any, i: number) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-background">
                                        <td className="px-4 py-2 text-sm text-primary">{new Date(h.completedAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-sm text-right font-medium text-primary">{h.delayDays}</td>
                                        <td className="px-4 py-2 text-sm text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs ${h.isDelayed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {h.isDelayed ? 'Late' : 'On Time'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetails;
