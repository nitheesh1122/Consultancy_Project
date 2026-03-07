import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Truck } from 'lucide-react';

const Suppliers = () => {
 const navigate = useNavigate();
 const [suppliers, setSuppliers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchSuppliers();
 }, []);

 const fetchSuppliers = async () => {
 try {
 const res = await api.get('/suppliers');
 // Populate stats for each supplier if the API returned just the list
 // For now assuming existing API returns list, but we might need to fetch stats individually 
 // OR ideally the GET /suppliers should return summary stats.
 // My controller getSuppliers returns just the list. 
 // I should update it to return stats or fetch them here.
 // For MVP I will just list them and let details page show stats, 
 // OR I can fetch stats for each (n+1) which is bad but ok for small list.
 setSuppliers(res.data);
 } catch (error) {
 console.error('Error fetching suppliers', error);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-2xl font-bold text-primary">Supplier Management</h2>
 <p className="text-secondary">Monitor supplier performance and reliability</p>
 </div>
 <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">
 Add Supplier
 </button>
 </div>

 <div className="bg-surface rounded-xl shadow-sm overflow-hidden border border-border">
 <table className="min-w-full divide-y divide-border">
 <thead className="bg-background">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Supplier</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Contact</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Categories</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="bg-surface divide-y divide-border">
 {loading ? (
 <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
 ) : suppliers.map((supplier) => (
 <tr key={supplier._id} className="hover:bg-background cursor-pointer" onClick={() => navigate(`/suppliers/${supplier._id}`)}>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <div className="h-10 w-10 flex-shrink-0 bg-primary/20 rounded-full flex items-center justify-center">
 <Truck className="h-5 w-5 text-primary" />
 </div>
 <div className="ml-4">
 <div className="text-sm font-medium text-primary">{supplier.name}</div>
 <div className="text-sm text-secondary">Since {new Date(supplier.createdAt).getFullYear()}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="text-sm text-primary">{supplier.contactPerson}</div>
 <div className="text-sm text-secondary">{supplier.phone}</div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex flex-wrap gap-1">
 {supplier.materialCategories.map((cat: string) => (
 <span key={cat} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
 {cat}
 </span>
 ))}
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
 {supplier.isActive ? 'Active' : 'Inactive'}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
 <span className="text-primary hover:text-primary">View Analytics</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default Suppliers;
