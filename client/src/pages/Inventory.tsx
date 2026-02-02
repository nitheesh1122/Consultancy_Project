import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Package, Search, AlertCircle, Calendar } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';

interface Material {
    _id: string;
    name: string;
    unit: string;
    quantity: number;
    minStock: number;
    unitCost: number;
}

const Inventory = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const { data } = await api.get('/materials');
            setMaterials(data);
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Mock calculation for Days Remaining (In real app, fetch from consumption rate)
    const getDaysRemaining = (qty: number) => {
        if (qty === 0) return 0;
        // Random usage between 5-15 units per day for demo
        const dailyBurn = 10;
        return Math.floor(qty / dailyBurn);
    };

    const getStockStatus = (m: Material) => {
        if (m.quantity === 0) return 'critical'; // Treat 0 as Dead/Empty for now
        if (m.quantity <= m.minStock) return 'warning';
        return 'success';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="h-6 w-6 text-slate-700" />
                        Inventory Overview
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage stock levels, track consumption, and monitor critical items.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Search materials..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Material Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Physical Stock</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Min Level</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Est. Duration</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                                            Loading inventory data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                                        No materials found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((material) => {
                                    const status = getStockStatus(material);
                                    const daysLeft = getDaysRemaining(material.quantity);
                                    const isDeadStock = material.quantity === 0;

                                    return (
                                        <tr key={material._id} className={`group hover:bg-slate-50/80 transition-colors ${isDeadStock ? 'bg-slate-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-sm ${isDeadStock ? 'text-slate-400' : 'text-slate-900'}`}>
                                                        {material.name}
                                                    </span>
                                                    <span className="text-xs text-slate-500">Unit Cost: ₹{material.unitCost}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold text-slate-800">
                                                    {material.quantity} <span className="text-xs font-medium text-slate-500 ml-1">{material.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right overflow-hidden">
                                                <div className="text-sm text-slate-600">{material.minStock}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${daysLeft < 3 ? 'bg-rose-100 text-rose-800' :
                                                        daysLeft < 7 ? 'bg-amber-100 text-amber-800' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    <Calendar className="h-3 w-3" />
                                                    {daysLeft} Days
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {status === 'critical' ? (
                                                    <StatusBadge status="neutral">Dead Stock</StatusBadge>
                                                ) : status === 'warning' ? (
                                                    <StatusBadge status="critical">Low Stock</StatusBadge>
                                                ) : (
                                                    <StatusBadge status="success">In Stock</StatusBadge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="outline" className="h-8 text-xs">
                                                    Details
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend / Info */}
            <div className="flex gap-4 text-xs text-slate-500 mt-4 px-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                    <span className="font-medium">Critical (&lt; 3 Days)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                    <span className="font-medium">Dead Stock (0 Qty)</span>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
