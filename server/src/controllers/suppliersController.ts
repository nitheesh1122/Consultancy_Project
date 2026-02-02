import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Supplier } from '../models/Supplier';
import { ProductInward } from '../models/ProductInward';

interface AuthRequest extends Request {
    user?: any;
}

// Get all suppliers with summary stats
export const getSuppliers = async (req: AuthRequest, res: Response) => {
    try {
        const suppliers = await Supplier.find();

        // Enrich with basic stats if needed, or keeping it simple for list view
        // For heavy analytics, we might want to do this in a separate aggregation or on-demand
        res.json(suppliers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get single supplier details with analytics
export const getSupplierAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const supplier = await Supplier.findById(id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Analytics: Only for COMPLETED PIs
        const stats = await ProductInward.aggregate([
            {
                $match: {
                    supplierId: new mongoose.Types.ObjectId(id as string),
                    status: 'COMPLETED',
                    completedAt: { $exists: true },
                    approvedAt: { $exists: true }
                }
            },
            {
                $project: {
                    deliveryTime: {
                        $divide: [
                            { $subtract: ["$completedAt", "$approvedAt"] },
                            1000 * 60 * 60 * 24 // Convert ms to days
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCompletedPIs: { $sum: 1 },
                    avgDeliveryTime: { $avg: "$deliveryTime" },
                    delayedPIs: {
                        $sum: {
                            $cond: [{ $gt: ["$deliveryTime", 5] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || { totalCompletedPIs: 0, avgDeliveryTime: 0, delayedPIs: 0 };
        const delayedRate = result.totalCompletedPIs > 0
            ? (result.delayedPIs / result.totalCompletedPIs) * 100
            : 0;

        // Delay History (Recent 10)
        const history = await ProductInward.find({
            supplierId: id,
            status: 'COMPLETED'
        })
            .select('createdAt approvedAt completedAt status')
            .sort({ completedAt: -1 })
            .limit(10)
            .lean()
            .then(docs => docs.map((doc: any) => {
                const delay = doc.completedAt && doc.approvedAt
                    ? (new Date(doc.completedAt).getTime() - new Date(doc.approvedAt).getTime()) / (86400000)
                    : 0;
                return {
                    ...doc,
                    delayDays: parseFloat(delay.toFixed(1)),
                    isDelayed: delay > 5
                };
            }));

        res.json({
            supplier,
            metrics: {
                totalCompletedPIs: result.totalCompletedPIs,
                avgDeliveryTime: parseFloat(result.avgDeliveryTime.toFixed(1)),
                delayedCount: result.delayedPIs,
                onTimePercentage: parseFloat((100 - delayedRate).toFixed(1)),
                status: delayedRate < 20 ? 'Good' : delayedRate < 40 ? 'Watch' : 'Poor'
            },
            history
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
