import { AuditLog } from '../models/AuditLog';
import ProductionBatch from '../models/ProductionBatch';
import { MRS } from '../models/MRS';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';

export const getDailyActivitySummary = async (startDate: Date, endDate: Date) => {
    // 1. Total batches processed (Completed in range)
    const completedBatchesCount = await ProductionBatch.countDocuments({
        status: 'COMPLETED',
        endTime: { $gte: startDate, $lte: endDate }
    });

    // 2. Material requests (MRS) created and approved/rejected
    const mrsCreatedCount = await MRS.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
    });

    const mrsResolvedCount = await MRS.countDocuments({
        status: { $in: ['ISSUED', 'REJECTED'] },
        updatedAt: { $gte: startDate, $lte: endDate }
    });

    // 3. Audit log actions count
    const auditActionsCount = await AuditLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate }
    });

    // 4. System errors (Failed operations usually logged with status FAILED or similar in details)
    const systemErrorsCount = await AuditLog.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        // Checking if details.status === 'FAILED' or action === 'ERROR'
        $or: [
            { 'details.status': 'FAILED' },
            { 'details.error': { $exists: true } },
            { action: { $regex: /fail|error/i } }
        ]
    });

    // 5. Total active users logged in (count unique users logging in)
    // Assuming action 'LOGIN' is logged in AuditLog
    const loginDocs = await AuditLog.find({
        action: 'LOGIN',
        timestamp: { $gte: startDate, $lte: endDate }
    }).distinct('userId');
    const activeUsersCount = loginDocs.length;

    // 6. Inventory changes count
    const inventoryChangesCount = await Transaction.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
    });

    return {
        reportGeneratedAt: new Date().toISOString(),
        dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        },
        metrics: {
            totalBatchesProcessed: completedBatchesCount,
            totalMaterialRequestsCreated: mrsCreatedCount,
            totalMaterialRequestsResolved: mrsResolvedCount,
            totalAuditActions: auditActionsCount,
            totalSystemErrors: systemErrorsCount,
            totalActiveUsersLoggedIn: activeUsersCount,
            totalInventoryChanges: inventoryChangesCount
        }
    };
};
