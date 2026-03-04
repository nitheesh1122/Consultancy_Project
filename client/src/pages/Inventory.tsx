import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Package, Search, Calendar } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import ProcurementContextModal from '../components/modals/ProcurementContextModal';

interface Material {
    _id: string;
    name: string;
    unit: string;
    quantity: number;
    minStock: number;
    unitCost: number;
    abcCategory?: 'A' | 'B' | 'C' | 'None';
}

const Inventory = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);

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

    const handleOpenContext = (id: string) => {
        setSelectedMaterialId(id);
        setIsContextModalOpen(true);
    };

    const handleCloseContext = () => {
        setIsContextModalOpen(false);
        setSelectedMaterialId(null);
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDaysRemaining = (qty: number) => {
        if (qty === 0) return 0;
        const dailyBurn = 10;
        return Math.floor(qty / dailyBurn);
    };

    const getStockStatus = (m: Material) => {
        if (m.quantity === 0) return 'critical';
        if (m.quantity <= m.minStock) return 'warning';
        return 'success';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-primary tracking-tight flex items-center gap-3">
                        <Package className="h-6 w-6 text-brand-primary" />
                        Inventory Overview
                    </h1>
                    <p className="text-secondary text-sm mt-1">Manage stock levels, track consumption, and monitor critical items.</p>
                </div>

                <div className="relative w-full md:w-[400px] flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await api.get('/materials/abc');
                                await fetchMaterials();
                            } catch (err) {
                                console.error(err);
                            }
                        }}
                        className="font-bold relative overflow-hidden group"
                        title="Run ABC Analysis"
                    >
                        <span className="relative z-10">Run ABC</span>
                        <div className="absolute inset-0 bg-brand-primary/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </Button>
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted group-focus-within:text-brand-primary transition-colors" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search materials..."
                            className="pl-9 bg-elevated border-transparent focus-visible:border-brand-primary w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-lg border border-subtle overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Material Details</TableHead>
                            <TableHead className="text-right">Physical Stock</TableHead>
                            <TableHead className="text-right w-32">Min Level</TableHead>
                            <TableHead className="text-center w-36">Est. Duration</TableHead>
                            <TableHead className="text-center w-32">Status</TableHead>
                            <TableHead className="text-right w-24">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-secondary">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-5 w-5 border-2 border-subtle border-t-brand-primary rounded-full animate-spin"></div>
                                        <span className="font-mono text-sm">Loading inventory data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredMaterials.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-secondary italic font-mono text-sm">
                                    No materials found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMaterials.map((material) => {
                                const status = getStockStatus(material);
                                const daysLeft = getDaysRemaining(material.quantity);
                                const isDeadStock = material.quantity === 0;

                                // Stock Progress Calculation
                                const maxStockRef = Math.max(material.quantity, material.minStock * 3, 100);
                                const stockPercent = Math.min((material.quantity / maxStockRef) * 100, 100);
                                const minPercent = Math.min((material.minStock / maxStockRef) * 100, 100);

                                return (
                                    <TableRow key={material._id} className={isDeadStock ? 'bg-canvas/50' : ''}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold font-heading text-sm ${isDeadStock ? 'text-muted' : 'text-primary'}`}>
                                                        {material.name}
                                                    </span>
                                                    {material.abcCategory && material.abcCategory !== 'None' && (
                                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wider ${material.abcCategory === 'A' ? 'bg-brand-primary text-white shadow-sm' :
                                                            material.abcCategory === 'B' ? 'bg-brand-light text-brand-primary border border-brand-primary' :
                                                                'bg-elevated text-muted border border-subtle'
                                                            }`}>
                                                            Class {material.abcCategory}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-secondary font-mono mt-0.5">₹{material.unitCost} / {material.unit}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-bold text-primary font-mono tabular-nums text-base">
                                                {material.quantity} <span className="text-xs text-muted ml-0.5">{material.unit}</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full bg-elevated rounded-full h-1.5 mt-2 relative overflow-hidden">
                                                <div
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${status === 'critical' || status === 'warning' ? 'bg-status-danger' : 'bg-status-success'
                                                        }`}
                                                    style={{ width: `${stockPercent}%` }}
                                                />
                                                {/* Min Level Marker */}
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-primary/20"
                                                    style={{ left: `${minPercent}%` }}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-sm font-semibold text-secondary font-mono tabular-nums">{material.minStock} {material.unit}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${daysLeft < 3 ? 'bg-status-danger/10 text-status-danger border-status-danger/20' :
                                                daysLeft < 7 ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
                                                    'bg-elevated text-secondary border-subtle'
                                                }`}>
                                                <Calendar className="h-3 w-3" />
                                                <span className="font-mono">{daysLeft}</span> Days
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {status === 'critical' ? (
                                                <StatusBadge status="neutral">Dead Stock</StatusBadge>
                                            ) : status === 'warning' ? (
                                                <StatusBadge status="critical">Low Stock</StatusBadge>
                                            ) : (
                                                <StatusBadge status="success">In Stock</StatusBadge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs font-bold border-subtle hover:border-brand-primary hover:text-brand-primary"
                                                onClick={() => handleOpenContext(material._id)}
                                            >
                                                Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex gap-6 text-xs text-secondary mt-4 px-4 bg-card p-3 rounded-lg border border-subtle">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-status-danger rounded-sm"></span>
                    <span className="font-medium font-heading tracking-wide">Critical (&lt; 3 Days) <span className="text-muted ml-1">- Restock immediately</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-subtle border border-muted rounded-sm"></span>
                    <span className="font-medium font-heading tracking-wide">Dead Stock (0 Qty) <span className="text-muted ml-1">- No issue in 60 days</span></span>
                </div>
            </div>

            {/* Context Modal */}
            <ProcurementContextModal
                isOpen={isContextModalOpen}
                onClose={handleCloseContext}
                materialId={selectedMaterialId}
            />
        </div>
    );
};

export default Inventory;
