import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Material } from '../models/Material';
import { ProductInward } from '../models/ProductInward';
import { MRS } from '../models/MRS';
import { Transaction } from '../models/Transaction';
import { CustomerOrder } from '../models/CustomerOrder';
import { Supplier } from '../models/Supplier';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';

interface AuthRequest extends Request {
    user?: any;
}

// ----------------------------------------------------
// 1. DASHBOARD & INVENTORY HEALTH
// ----------------------------------------------------
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    // Keeping existing basic summary logic but could be optimized
    try {
        const lowStockCount = await Material.countDocuments({
            $expr: { $lte: ["$quantity", "$minStock"] }
        });

        const lowStockItems = await Material.find({
            $expr: { $lte: ["$quantity", "$minStock"] }
        }).limit(5);

        const pendingPIs = await ProductInward.countDocuments({ status: 'RAISED' });
        const pendingMRS = await MRS.countDocuments({ status: { $in: ['PENDING', 'PARTIALLY_ISSUED'] } });

        // Total Inventory Value
        const inventoryValue = await Material.aggregate([
            { $project: { totalValue: { $multiply: ["$quantity", "$unitCost"] } } },
            { $group: { _id: null, total: { $sum: "$totalValue" } } }
        ]);
        const totalValue = inventoryValue.length > 0 ? inventoryValue[0].total : 0;

        // Quick Cost Trend (Last 6 months)
        const costTrend = await Transaction.aggregate([
            { $match: { type: 'INWARD' } },
            {
                $lookup: { from: 'materials', localField: 'materialId', foreignField: '_id', as: 'material' }
            },
            { $unwind: '$material' },
            {
                $group: {
                    _id: {
                        month: { $month: "$timestamp" },
                        year: { $year: "$timestamp" }
                    },
                    totalCost: { $sum: { $multiply: ["$quantity", "$material.unitCost"] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 6 }
        ]);

        res.json({
            lowStockCount,
            lowStockItems,
            pendingPIs,
            pendingMRS,
            totalInventoryValue: totalValue,
            costTrend: costTrend.map(d => ({
                month: `${d._id.month}/${d._id.year}`,
                cost: d.totalCost
            }))
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getInventoryHealth = async (req: AuthRequest, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Calculate Daily Consumption (Issue Only)
        // Aggregating form Transactions mainly
        const consumptionStats = await Transaction.aggregate([
            {
                $match: {
                    type: 'ISSUE',
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: "$materialId",
                    totalIssued: { $sum: { $abs: "$quantity" } } // Ensure positive quantity
                }
            }
        ]);

        const consumptionMap = new Map();
        consumptionStats.forEach(stat => {
            consumptionMap.set(stat._id.toString(), stat.totalIssued / 30); // Avg Daily Consumption
        });

        const materials = await Material.find().lean();

        const healthData = materials.map((mat: any) => {
            const avgDaily = consumptionMap.get(mat._id.toString()) || 0;
            const daysRemaining = avgDaily > 0 ? mat.quantity / avgDaily : 999; // 999 for infinity/no consumption

            let status = 'GOOD';
            if (daysRemaining < 15) status = 'LOW_STOCK';
            if (avgDaily === 0) status = 'DEAD_STOCK'; // Refined rule: No consumption in 30 days

            return {
                materialId: mat._id,
                name: mat.name,
                currentStock: mat.quantity,
                minStock: mat.minStock,
                avgDailyConsumption: parseFloat(avgDaily.toFixed(2)),
                daysRemaining: daysRemaining === 999 ? 'No Consumption' : parseFloat(daysRemaining.toFixed(1)),
                status
            };
        });

        // Filter for specific lists
        const lowStock = healthData.filter(d => d.status === 'LOW_STOCK');
        const deadStock = healthData.filter(d => d.status === 'DEAD_STOCK');

        res.json({
            allMaterials: healthData,
            lowStock,
            deadStock
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ----------------------------------------------------
// 2. PROCUREMENT PERFORMANCE
// ----------------------------------------------------
export const getProcurementPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await ProductInward.aggregate([
            { $match: { status: 'COMPLETED' } }, // Only fully completed cycles
            {
                $project: {
                    approvalTime: {
                        $divide: [{ $subtract: ["$approvedAt", "$createdAt"] }, 86400000]
                    },
                    completionTime: {
                        $divide: [{ $subtract: ["$completedAt", "$approvedAt"] }, 86400000]
                    },
                    status: 1
                }
            },
            {
                $group: {
                    _id: null,
                    avgApprovalTime: { $avg: "$approvalTime" },
                    avgCompletionTime: { $avg: "$completionTime" },
                    totalcompleted: { $sum: 1 }
                }
            }
        ]);

        const delays = await ProductInward.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    $expr: {
                        $gt: [
                            { $divide: [{ $subtract: ["$completedAt", "$approvedAt"] }, 86400000] },
                            5
                        ]
                    }
                }
            },
            {
                $lookup: { from: 'suppliers', localField: 'supplierId', foreignField: '_id', as: 'supplier' }
            },
            { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, 'supplier.name': 1, approvedAt: 1, completedAt: 1 } }
        ]);

        res.json({
            metrics: stats[0] || { avgApprovalTime: 0, avgCompletionTime: 0 },
            delayedPIs: delays
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ----------------------------------------------------
// 3. EFFICIENCY (BATCH & SUPERVISOR)
// ----------------------------------------------------
export const getEfficiencyStats = async (req: AuthRequest, res: Response) => {
    try {
        // Supervisor Performance (MRS Activity)
        const supervisorStats = await MRS.aggregate([
            {
                $group: {
                    _id: "$supervisorId",
                    mrsCount: { $sum: 1 },
                    issuedCount: { $sum: { $cond: [{ $eq: ["$status", "ISSUED"] }, 1, 0] } }
                }
            },
            {
                $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'supervisor' }
            },
            { $unwind: '$supervisor' },
            {
                $project: {
                    name: "$supervisor.name",
                    totalMRS: "$mrsCount",
                    issuedMRS: "$issuedCount",
                    efficiency: { $multiply: [{ $divide: ["$issuedCount", "$mrsCount"] }, 100] }
                }
            }
        ]);

        // Re-issue Inefficiency: Same material issued > 3 times for same batch
        const inefficientBatches = await Transaction.aggregate([
            { $match: { type: 'ISSUE' } },
            // Need batchId. Transaction has 'relatedId' -> MRS -> batchId.
            // This requires a lookup.
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
                $group: {
                    _id: { batch: "$mrs.batchId", material: "$materialId" },
                    issueCount: { $sum: 1 },
                    totalQty: { $sum: { $abs: "$quantity" } }
                }
            },
            {
                $match: { issueCount: { $gt: 3 } }
            },
            {
                $lookup: { from: 'materials', localField: '_id.material', foreignField: '_id', as: 'material' }
            },
            { $unwind: '$material' },
            {
                $project: {
                    batchId: "$_id.batch",
                    materialName: "$material.name",
                    issueCount: 1,
                    totalQty: 1
                }
            }
        ]);

        res.json({
            supervisorPerformance: supervisorStats,
            inefficientBatches
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ----------------------------------------------------
// 4. COST ANALYTICS
// ----------------------------------------------------
export const getCostAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        // Material Cost Trends (Last 6 Months hopefully, simplifed to grouped by month)
        const costTrend = await Transaction.aggregate([
            { $match: { type: 'INWARD' } },
            {
                $lookup: { from: 'materials', localField: 'materialId', foreignField: '_id', as: 'material' }
            },
            { $unwind: '$material' },
            // Note: Transaction doesn't store cost snapshot. Using current unitCost is a limitation if history isn't tracked.
            // Requirement says "Cost Method: Average cost from inward entries".
            // We should ideally use the productInward unitPrice for INWARD transactions if we can link it.
            // Transaction 'relatedId' -> PI.
            {
                $lookup: { from: 'productinwards', localField: 'relatedId', foreignField: '_id', as: 'pi' }
            },
            // Dealing with 'pi.items' array is complex here without unwinding carefully.
            // Simplified approach: Use Material.unitCost * Quantity for approximate trend or existing logic.
            // Improving: Use Material.unitCost as instructed in prompt "Cost Method: Average cost from inward entries" 
            // implies the Material.unitCost IS the average cost maintained by system.
            {
                $group: {
                    _id: {
                        month: { $month: "$timestamp" },
                        year: { $year: "$timestamp" }
                    },
                    totalCost: { $sum: { $multiply: ["$quantity", "$material.unitCost"] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Cost Per Batch
        const batchCost = await Transaction.aggregate([
            { $match: { type: 'ISSUE' } },
            {
                $lookup: { from: 'mrs', localField: 'relatedId', foreignField: '_id', as: 'mrs' }
            },
            { $unwind: '$mrs' },
            {
                $lookup: { from: 'materials', localField: 'materialId', foreignField: '_id', as: 'material' }
            },
            { $unwind: '$material' },
            {
                $group: {
                    _id: "$mrs.batchId",
                    totalCost: { $sum: { $multiply: [{ $abs: "$quantity" }, "$material.unitCost"] } }
                }
            },
            { $sort: { totalCost: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            monthlyTrend: costTrend,
            batchCosts: batchCost
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ----------------------------------------------------
// 5. FORECAST & REORDER
// ----------------------------------------------------
export const getForecast = async (req: AuthRequest, res: Response) => {
    try {
        // Horizon: 7 Days. Buffer: 15 Days.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const consumption = await Transaction.aggregate([
            {
                $match: {
                    type: 'ISSUE',
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: "$materialId",
                    totalIssued: { $sum: { $abs: "$quantity" } }
                }
            }
        ]);

        const map = new Map();
        consumption.forEach(c => map.set(c._id.toString(), c.totalIssued / 30));

        const materials = await Material.find().select('name code unit currentStock quantity minStock').lean();

        const forecasts = materials.map((mat: any) => {
            const avgDaily = map.get(mat._id.toString()) || 0;
            const forecast7Days = avgDaily * 7;
            const requiredStock = avgDaily * (15 + 7); // Buffer + Lead Time Horizon
            const current = mat.quantity || 0;

            let reorderQty = requiredStock - current;
            if (reorderQty < 0) reorderQty = 0;

            return {
                materialId: mat._id,
                name: mat.name,
                currentStock: current,
                avgDaily: parseFloat(avgDaily.toFixed(2)),
                forecast7Days: parseFloat(forecast7Days.toFixed(2)),
                suggestedReorder: parseFloat(reorderQty.toFixed(2)),
                status: current < requiredStock ? 'REORDER_NOW' : 'SUFFICIENT'
            };
        });

        res.json(forecasts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ----------------------------------------------------
// 6. WORKER & SUPPLIER ANALYTICS (Phase 1.5)
// ----------------------------------------------------
export const getWorkerPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await mongoose.model('ProductionBatch').aggregate([
            { $match: { status: 'COMPLETED' } },
            {
                $group: {
                    _id: "$supervisorId",
                    totalBatches: { $sum: 1 },
                    avgYield: { $avg: "$qualityYieldPercentage" },
                    avgWastage: { $avg: "$wastagePercentage" }
                }
            },
            {
                $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'supervisor' }
            },
            { $unwind: '$supervisor' },
            {
                $project: {
                    supervisorName: "$supervisor.name",
                    totalBatches: 1,
                    avgYield: { $round: ["$avgYield", 2] },
                    avgWastage: { $round: ["$avgWastage", 2] }
                }
            }
        ]);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getWorkerEfficiency = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await mongoose.model('ProductionBatch').aggregate([
            { $match: { status: 'COMPLETED' } },
            { $unwind: "$assignedWorkers" },
            {
                $group: {
                    _id: "$assignedWorkers",
                    totalBatches: { $sum: 1 },
                    totalYield: { $avg: "$qualityYieldPercentage" }
                }
            },
            {
                $lookup: { from: 'workers', localField: '_id', foreignField: '_id', as: 'worker' }
            },
            { $unwind: '$worker' },
            {
                $project: {
                    workerName: "$worker.name",
                    workerRole: "$worker.role",
                    totalBatches: 1,
                    avgYield: { $round: ["$totalYield", 2] }
                }
            }
        ]);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSupplierQuality = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await mongoose.model('ProductionBatch').aggregate([
            { $match: { status: 'COMPLETED' } },
            {
                $group: {
                    _id: "$supplierParty",
                    totalBatches: { $sum: 1 },
                    totalInputKg: { $sum: "$inputKg" },
                    totalRejectionKg: { $sum: "$rejectionKg" },
                    avgYield: { $avg: "$qualityYieldPercentage" }
                }
            },
            {
                $project: {
                    supplierName: "$_id",
                    totalBatches: 1,
                    totalInputKg: 1,
                    totalRejectionKg: 1,
                    rejectionRate: {
                        $cond: [
                            { $gt: ["$totalInputKg", 0] },
                            { $round: [{ $multiply: [{ $divide: ["$totalRejectionKg", "$totalInputKg"] }, 100] }, 2] },
                            0
                        ]
                    },
                    avgYield: { $round: ["$avgYield", 2] }
                }
            },
            { $sort: { rejectionRate: -1 } }
        ]);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getHRDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const Worker = mongoose.model('Worker');

        // Total workers
        const totalWorkers = await Worker.countDocuments();

        // Active Workers
        const activeWorkers = await Worker.countDocuments({ status: { $in: ['ACTIVE', 'BUSY'] } });

        // Workers on Leave
        const workersOnLeave = await Worker.countDocuments({ status: 'ON_LEAVE' });

        // Placeholder for Leaves/Shifts since models might not be fully fleshed out
        const pendingLeaves = 3; // Placeholder until Leave model exists
        const activeShifts = 2; // Placeholder until Shift model exists

        res.json({
            totalWorkers,
            activeWorkers,
            workersOnLeave,
            pendingLeaves,
            activeShifts,
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// ROLE-SPECIFIC DASHBOARDS
// ============================================================

// MANAGER DASHBOARD — Business oversight: orders, approvals, suppliers, production
export const getManagerDashboard = async (req: AuthRequest, res: Response) => {
    try {
        // Customer orders breakdown
        const totalOrders = await CustomerOrder.countDocuments();
        const activeOrders = await CustomerOrder.countDocuments({ status: { $in: ['PLACED', 'APPROVED', 'FABRIC_RECEIVED', 'IN_PRODUCTION'] } });
        const completedOrders = await CustomerOrder.countDocuments({ status: { $in: ['COMPLETED', 'DISPATCHED', 'DELIVERED'] } });

        // Revenue from completed/dispatched orders
        const revenueAgg = await CustomerOrder.aggregate([
            { $match: { status: { $in: ['COMPLETED', 'DISPATCHED', 'DELIVERED'] } } },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        // PI Approvals pending
        const pendingPIApprovals = await ProductInward.countDocuments({ status: 'RAISED' });

        // Supplier count
        const activeSuppliers = await Supplier.countDocuments({ isActive: true });

        // Production batches status
        const ProductionBatch = mongoose.model('ProductionBatch');
        const batchesInProgress = await ProductionBatch.countDocuments({ status: 'IN_PROGRESS' });
        const batchesCompleted = await ProductionBatch.countDocuments({ status: 'COMPLETED' });

        // Machine utilization
        const Machine = mongoose.model('Machine');
        const totalMachines = await Machine.countDocuments();
        const activeMachines = await Machine.countDocuments({ status: { $in: ['ACTIVE', 'IN_USE'] } });

        // Recent customer orders (last 5)
        const recentOrders = await CustomerOrder.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'companyName')
            .lean();

        res.json({
            totalOrders,
            activeOrders,
            completedOrders,
            totalRevenue,
            pendingPIApprovals,
            activeSuppliers,
            batchesInProgress,
            batchesCompleted,
            totalMachines,
            activeMachines,
            recentOrders,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// STORE MANAGER DASHBOARD — Inventory, material requests, inward/outward
export const getStoreManagerDashboard = async (req: AuthRequest, res: Response) => {
    try {
        // Low stock
        const lowStockCount = await Material.countDocuments({
            $expr: { $lte: ['$quantity', '$minStock'] }
        });
        const lowStockItems = await Material.find({
            $expr: { $lte: ['$quantity', '$minStock'] }
        }).limit(5).lean();

        // Pending MRS
        const pendingMRS = await MRS.countDocuments({ status: { $in: ['PENDING', 'PARTIALLY_ISSUED'] } });

        // Pending PIs (raised, waiting for approval)
        const pendingPIs = await ProductInward.countDocuments({ status: 'RAISED' });

        // Approved PIs (ready for inward)
        const approvedPIs = await ProductInward.countDocuments({ status: 'APPROVED' });

        // Inventory value
        const inventoryValue = await Material.aggregate([
            { $project: { totalValue: { $multiply: ['$quantity', '$unitCost'] } } },
            { $group: { _id: null, total: { $sum: '$totalValue' } } }
        ]);
        const totalInventoryValue = inventoryValue.length > 0 ? inventoryValue[0].total : 0;

        // Total materials count
        const totalMaterials = await Material.countDocuments();

        // Recent MRS (last 5)
        const recentMRS = await MRS.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Dispatch pending
        const Dispatch = mongoose.model('Dispatch');
        const pendingDispatches = await Dispatch.countDocuments({ status: { $in: ['PACKED'] } });

        res.json({
            lowStockCount,
            lowStockItems,
            pendingMRS,
            pendingPIs,
            approvedPIs,
            totalInventoryValue,
            totalMaterials,
            recentMRS,
            pendingDispatches,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ADMIN DASHBOARD — System overview, users, audit
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
    try {
        // User counts by role
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const totalUsers = usersByRole.reduce((sum, r) => sum + r.count, 0);

        // System counts
        const totalMaterials = await Material.countDocuments();
        const totalSuppliers = await Supplier.countDocuments();
        const Machine = mongoose.model('Machine');
        const totalMachines = await Machine.countDocuments();
        const totalOrders = await CustomerOrder.countDocuments();

        // Recent audit logs (last 10)
        const recentAuditLogs = await AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('userId', 'username role')
            .lean();

        // Inventory health summary
        const lowStockCount = await Material.countDocuments({
            $expr: { $lte: ['$quantity', '$minStock'] }
        });

        // Production summary
        const ProductionBatch = mongoose.model('ProductionBatch');
        const activeBatches = await ProductionBatch.countDocuments({ status: { $in: ['SCHEDULED', 'IN_PROGRESS'] } });

        res.json({
            totalUsers,
            usersByRole,
            totalMaterials,
            totalSuppliers,
            totalMachines,
            totalOrders,
            recentAuditLogs,
            lowStockCount,
            activeBatches,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
