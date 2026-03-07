import { AuditLog } from '../models/AuditLog';
import ProductionBatch from '../models/ProductionBatch';
import { MRS } from '../models/MRS';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';

// Maps action strings to a human-readable module category
const getModule = (action: string): string => {
    if (['USER_LOGIN', 'USER_REGISTERED', 'USER_DELETED'].includes(action)) return 'Authentication';
    if (['MATERIAL_ADDED', 'MATERIAL_UPDATED', 'MATERIAL_DELETED'].includes(action)) return 'Inventory';
    if (['MRS_CREATED', 'MRS_ISSUED', 'MRS_REJECTED', 'MATERIAL_RETURNED', 'PI_RAISED', 'PI_STATUS_UPDATED', 'INWARD_PROCESSED'].includes(action)) return 'Procurement';
    if (['BATCH_CREATED', 'BATCH_STARTED', 'BATCH_COMPLETED'].includes(action)) return 'Production';
    return 'System';
};

export const getDailyActivitySummary = async (startDate: Date, endDate: Date) => {
    const dateFilter = { $gte: startDate, $lte: endDate };

    // --- Core Operational Metrics ---
    const [
        completedBatchesCount,
        mrsCreatedCount,
        mrsResolvedCount,
        inventoryChangesCount,
        allAuditLogs, // Fetch once and compute multiple stats from it
    ] = await Promise.all([
        ProductionBatch.countDocuments({ status: 'COMPLETED', endTime: dateFilter }),
        MRS.countDocuments({ createdAt: dateFilter }),
        MRS.countDocuments({ status: { $in: ['ISSUED', 'REJECTED'] }, updatedAt: dateFilter }),
        Transaction.countDocuments({ createdAt: dateFilter }),
        AuditLog.find({ timestamp: dateFilter }).populate('userId', 'username role').lean(),
    ]);

    // --- Audit-derived Metrics ---
    const totalAuditActions = allAuditLogs.length;

    const systemErrorsCount = allAuditLogs.filter(l =>
        l.action.toLowerCase().includes('fail') ||
        l.action.toLowerCase().includes('error') ||
        (l.details as any)?.error
    ).length;

    // Total logins
    const loginLogs = allAuditLogs.filter(l => l.action === 'USER_LOGIN');
    const totalLogins = loginLogs.length;
    const uniqueActiveUsers = new Set(loginLogs.map(l => String(l.userId))).size;

    // Actions grouped by module
    const actionsByModule: Record<string, number> = {};
    for (const log of allAuditLogs) {
        const mod = getModule(log.action);
        actionsByModule[mod] = (actionsByModule[mod] || 0) + 1;
    }

    // Top 5 most common actions
    const actionCounts: Record<string, number> = {};
    for (const log of allAuditLogs) {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }
    const topActions = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));

    // Most active users (top 5)
    const userCounts: Record<string, { username: string; count: number }> = {};
    for (const log of allAuditLogs) {
        const u = log.userId as any;
        if (u?.username) {
            const key = String(u._id);
            if (!userCounts[key]) userCounts[key] = { username: u.username, count: 0 };
            userCounts[key].count++;
        }
    }
    const mostActiveUsers = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Activity by day (for timeline — group by date string)
    const activityTimeline: Record<string, number> = {};
    for (const log of allAuditLogs) {
        const day = new Date(log.timestamp).toISOString().split('T')[0];
        activityTimeline[day] = (activityTimeline[day] || 0) + 1;
    }

    return {
        reportGeneratedAt: new Date().toISOString(),
        dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        },
        metrics: {
            // Operational
            totalBatchesProcessed: completedBatchesCount,
            totalMaterialRequestsCreated: mrsCreatedCount,
            totalMaterialRequestsResolved: mrsResolvedCount,
            totalInventoryChanges: inventoryChangesCount,
            // Audit-derived
            totalAuditActions,
            totalSystemErrors: systemErrorsCount,
            totalLogins,
            totalActiveUsersLoggedIn: uniqueActiveUsers,
        },
        auditInsights: {
            actionsByModule,
            topActions,
            mostActiveUsers,
            activityTimeline,
        },
    };
};
