import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Package, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

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

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Package className="mr-2 h-6 w-6 text-indigo-600" />
                    Current Inventory
                </h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search materials..."
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Material Name</th>
                            <th className="px-6 py-3">Physical Stock</th>
                            <th className="px-6 py-3">Unit</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-4">Loading inventory...</td></tr>
                        ) : (
                            filteredMaterials.map((material) => (
                                <tr key={material._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{material.name}</td>
                                    <td className={`px-6 py-4 font-bold ${material.quantity <= material.minStock ? 'text-red-600' : 'text-gray-700'}`}>
                                        {material.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{material.unit}</td>
                                    <td className="px-6 py-4">
                                        {material.quantity <= material.minStock ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Low Stock</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;
