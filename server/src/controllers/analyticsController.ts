import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Material } from '../models/Material';
import { ProductInward } from '../models/ProductInward';
import { MRS } from '../models/MRS';

interface AuthRequest extends Request {
    user?: any;
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Low Stock Items
        const lowStockMaterials = await Material.find({
            $expr: { $lte: ["$quantity", "$minStock"] }
        }).select('name quantity minStock unit');

        // 2. Pending Actions (PIs and MRS)
        const pendingPIs = await ProductInward.countDocuments({ status: 'RAISED' });
        const pendingMRS = await MRS.countDocuments({ status: { $in: ['PENDING', 'PARTIALLY_ISSUED'] } });

        // 3. Total Inventory Value (Approx)
        // using aggregation for performance
        const inventoryValue = await Material.aggregate([
            {
                $project: {
                    totalValue: { $multiply: ["$quantity", "$unitCost"] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalValue" }
                }
            }
        ]);

        const totalValue = inventoryValue.length > 0 ? inventoryValue[0].total : 0;

        res.json({
            lowStockCount: lowStockMaterials.length,
            lowStockItems: lowStockMaterials,
            pendingPIs,
            pendingMRS,
            totalInventoryValue: totalValue
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getConsumptionStats = async (req: AuthRequest, res: Response) => {
    try {
        // Find ISSUE transactions
        const stats = await mongoose.connection.collection('transactions').aggregate([
            { $match: { type: 'ISSUE' } },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'materialId',
                    foreignField: '_id',
                    as: 'material'
                }
            },
            { $unwind: '$material' },
            {
                $group: {
                    _id: '$materialId',
                    name: { $first: '$material.name' },
                    unit: { $first: '$material.unit' },
                    totalQuantity: { $sum: { $abs: '$quantity' } }, // Quantity is negative in ISSUE
                    totalCost: { $sum: { $multiply: [{ $abs: '$quantity' }, '$material.unitCost'] } }
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]).toArray();

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getBatchStats = async (req: AuthRequest, res: Response) => {
    try {
        // Find ISSUE transactions linked to MRS
        const stats = await mongoose.connection.collection('transactions').aggregate([
            { $match: { type: 'ISSUE' } },
            {
                $lookup: {
                    from: 'mrs',
                    localField: 'relatedId',
                    foreignField: '_id',
                    as: 'mrs'
                }
            },
            { $unwind: '$mrs' },
            {
                $lookup: {
                    from: 'materials',
                    localField: 'materialId',
                    foreignField: '_id',
                    as: 'material'
                }
            },
            { $unwind: '$material' },
            {
                $group: {
                    _id: '$mrs.batchId',
                    totalCost: { $sum: { $multiply: [{ $abs: '$quantity' }, '$material.unitCost'] } },
                    itemsCount: { $sum: 1 },
                    lastTransaction: { $max: '$timestamp' }
                }
            },
            { $sort: { lastTransaction: -1 } }
        ]).toArray();

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
