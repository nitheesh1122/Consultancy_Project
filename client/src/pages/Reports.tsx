import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, Layers } from 'lucide-react';

const Reports = () => {
    const [consumption, setConsumption] = useState<any[]>([]);
    const [batchStats, setBatchStats] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'CONSUMPTION' | 'BATCH'>('CONSUMPTION');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const [consRes, batchRes] = await Promise.all([
                api.get('/analytics/consumption'),
                api.get('/analytics/batch-stats')
            ]);
            setConsumption(consRes.data);
            setBatchStats(batchRes.data);
        } catch (error) {
            console.error('Error fetching reports', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Analytics & Reports</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('CONSUMPTION')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'CONSUMPTION' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Material Consumption
                    </button>
                    <button
                        onClick={() => setActiveTab('BATCH')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'BATCH' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Batch Costing
                    </button>
                </div>
            </div>

            {loading ? <p>Loading reports...</p> : (
                <>
                    {activeTab === 'CONSUMPTION' && (
                        <div className="space-y-6">
                            {/* Abstract Chart */}
                            <div className="bg-white p-6 rounded-lg shadow h-80">
                                <h3 className="text-lg font-bold mb-4 text-gray-700">Top Consumed Materials (Quantity)</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={consumption.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="totalQuantity" fill="#4F46E5" name="Quantity Used" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty Used</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {consumption.map((item) => (
                                            <tr key={item._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.totalQuantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₹{item.totalCost?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'BATCH' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800">Batch Cost Analysis</h3>
                                    <p className="text-sm text-gray-500">Total cost of materials issued per batch</p>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Issued</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Material Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {batchStats.map((batch) => (
                                            <tr key={batch._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch._id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.itemsCount}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(batch.lastTransaction).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">₹{batch.totalCost?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;
