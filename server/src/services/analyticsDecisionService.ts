import mongoose from 'mongoose';
import { Material } from '../models/Material';
import { MRS } from '../models/MRS';
import { ProductInward } from '../models/ProductInward';
import { Transaction } from '../models/Transaction';
import { CustomerOrder } from '../models/CustomerOrder';
import AnalyticsSnapshot from '../models/AnalyticsSnapshot';
import MetricFormulaVersion from '../models/MetricFormulaVersion';
import { Supplier } from '../models/Supplier';

export type AnalyticsWindow = '7d' | '30d' | '90d' | 'MTD' | 'QTD';
export type DecisionRole = 'ADMIN' | 'MANAGER' | 'STORE_MANAGER' | 'SUPERVISOR';

type Signal = 'critical' | 'warning' | 'good';
type TrendSignal = 'improving' | 'stable' | 'deteriorating';

export interface DecisionFeedItem {
    id: string;
    domain: 'inventory' | 'procurement' | 'production' | 'customer' | 'hr';
    priority: number;
    signal: Signal;
    metric: string;
    currentValue: number;
    previousValue: number;
    deltaPercent: number;
    trendSignal: TrendSignal;
    reason: string[];
    recommendedAction: string;
    actionLink: string;
    expectedImpact: string;
}

interface WindowRange {
    key: AnalyticsWindow;
    label: string;
    currentStart: Date;
    currentEnd: Date;
    previousStart: Date;
    previousEnd: Date;
}

interface DecisionFeedResponse {
    role: DecisionRole;
    window: AnalyticsWindow;
    windowLabel: string;
    generatedAt: string;
    topActions: DecisionFeedItem[];
    decisions: DecisionFeedItem[];
}

interface CachedDecisionFeed {
    expiresAt: number;
    payload: DecisionFeedResponse;
}

export interface DecisionDrilldownResponse {
    decisionId: string;
    title: string;
    columns: Array<{ key: string; label: string }>;
    rows: Array<Record<string, any>>;
}

const FEED_CACHE_TTL_MS = 5 * 60 * 1000;
const decisionFeedCache = new Map<string, CachedDecisionFeed>();

const getQuarterStart = (date: Date) => {
    const month = date.getMonth();
    const quarterStartMonth = Math.floor(month / 3) * 3;
    return new Date(date.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
};

const resolveWindow = (windowKey: string | undefined): WindowRange => {
    const now = new Date();
    const normalized = (windowKey || '30d').toUpperCase() as AnalyticsWindow;

    if (normalized === 'MTD') {
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const previousEnd = new Date(currentStart.getTime() - 1);
        return {
            key: 'MTD',
            label: 'Month-to-Date',
            currentStart,
            currentEnd: now,
            previousStart,
            previousEnd,
        };
    }

    if (normalized === 'QTD') {
        const currentStart = getQuarterStart(now);
        const previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1, 0, 0, 0, 0);
        const previousEnd = new Date(currentStart.getTime() - 1);
        return {
            key: 'QTD',
            label: 'Quarter-to-Date',
            currentStart,
            currentEnd: now,
            previousStart,
            previousEnd,
        };
    }

    const dayMap: Record<'7d' | '30d' | '90d', number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
    };

    const fallback = ['7d', '30d', '90d'].includes((windowKey || '').toLowerCase())
        ? ((windowKey || '').toLowerCase() as '7d' | '30d' | '90d')
        : '30d';

    const days = dayMap[fallback];
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - days * 24 * 60 * 60 * 1000);

    return {
        key: fallback,
        label: `${days} Days`,
        currentStart,
        currentEnd: now,
        previousStart,
        previousEnd,
    };
};

const toNumber = (value: unknown) => {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num : 0;
};

const deltaPercent = (current: number, previous: number) => {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
};

const getTrendSignal = (delta: number, higherIsBetter: boolean): TrendSignal => {
    if (Math.abs(delta) < 5) return 'stable';
    if (higherIsBetter) return delta > 0 ? 'improving' : 'deteriorating';
    return delta < 0 ? 'improving' : 'deteriorating';
};

const getPriority = (signal: Signal) => {
    if (signal === 'critical') return 1;
    if (signal === 'warning') return 2;
    return 3;
};

const getCacheKey = (role: DecisionRole, window: AnalyticsWindow) => `${role}:${window}`;

const normalizeSnapshotDate = (value = new Date()) => {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
};

const persistDailySnapshot = async (role: DecisionRole, window: AnalyticsWindow, payload: DecisionFeedResponse) => {
    const snapshotDate = normalizeSnapshotDate();
    await AnalyticsSnapshot.updateOne(
        { snapshotDate, role, window },
        {
            $set: {
                payload,
                generatedAt: new Date(),
            },
        },
        { upsert: true }
    );
};

const KPI_DICTIONARY_BASE = [
    {
        id: 'inventory-stockout-risk-days',
        domain: 'inventory',
        name: 'Stockout Risk (< 3 Days Cover)',
        formula: 'daysCover = quantity / avgDailyIssue(window)',
        desiredDirection: 'down' as const,
        thresholds: { warning: '>= 1 item', critical: '>= 8 items' },
        roles: ['STORE_MANAGER', 'MANAGER'],
    },
    {
        id: 'inventory-dead-stock-percent',
        domain: 'inventory',
        name: 'Dead Stock %',
        formula: 'materials without ISSUE in window / total materials * 100',
        desiredDirection: 'down' as const,
        thresholds: { warning: '>= 20%', critical: '>= 35%' },
        roles: ['STORE_MANAGER', 'ADMIN'],
    },
    {
        id: 'procurement-pi-cycle-time',
        domain: 'procurement',
        name: 'PI Approval Cycle Time',
        formula: 'avg(approvedAt - createdAt) in days',
        desiredDirection: 'down' as const,
        thresholds: { warning: '>= 1.5 days', critical: '>= 3 days' },
        roles: ['MANAGER', 'ADMIN'],
    },
    {
        id: 'procurement-lead-time-variance',
        domain: 'procurement',
        name: 'Supplier Lead-Time Variance',
        formula: 'stdDev(completedAt - approvedAt) in days',
        desiredDirection: 'down' as const,
        thresholds: { warning: '>= 1.2', critical: '>= 2.5' },
        roles: ['MANAGER', 'STORE_MANAGER', 'ADMIN'],
    },
    {
        id: 'production-delayed-batches',
        domain: 'production',
        name: 'Delayed Batches',
        formula: 'count(status in SCHEDULED/IN_PROGRESS and scheduledDate < now)',
        desiredDirection: 'down' as const,
        thresholds: { warning: '>= 4', critical: '>= 10' },
        roles: ['MANAGER', 'SUPERVISOR'],
    },
    {
        id: 'production-rework-percent',
        domain: 'production',
        name: 'Rework %',
        formula: 'avg(rejectionKg / inputKg * 100) for completed batches',
        desiredDirection: 'down' as const,
        thresholds: { warning: '>= 4%', critical: '>= 8%' },
        roles: ['MANAGER', 'SUPERVISOR', 'ADMIN'],
    },
    {
        id: 'customer-orders-at-risk',
        domain: 'customer',
        name: 'Orders At Risk',
        formula: 'count(deliveryDate <= now+3d and status not delivered/completed)',
        desiredDirection: 'down' as const,
        thresholds: { warning: '>= 5', critical: '>= 12' },
        roles: ['MANAGER', 'ADMIN'],
    },
];

const buildIssueMap = async (start: Date, end: Date) => {
    const rows = await Transaction.aggregate([
        {
            $match: {
                type: 'ISSUE',
                timestamp: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: '$materialId',
                totalIssued: { $sum: { $abs: '$quantity' } },
            },
        },
    ]);

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const map = new Map<string, number>();
    rows.forEach((row) => {
        map.set(String(row._id), toNumber(row.totalIssued) / days);
    });
    return map;
};

const getStoreManagerDecisionFeed = async (windowRange: WindowRange): Promise<DecisionFeedItem[]> => {
    const materials = await Material.find().select('name quantity minStock').lean();

    const currentIssueMap = await buildIssueMap(windowRange.currentStart, windowRange.currentEnd);
    const previousIssueMap = await buildIssueMap(windowRange.previousStart, windowRange.previousEnd);

    const stockRiskCurrent = materials
        .map((m: any) => {
            const dailyUse = currentIssueMap.get(String(m._id)) || 0;
            const daysCover = dailyUse > 0 ? m.quantity / dailyUse : Number.POSITIVE_INFINITY;
            return {
                id: String(m._id),
                name: m.name,
                daysCover,
            };
        })
        .filter((m) => m.daysCover < 3)
        .sort((a, b) => a.daysCover - b.daysCover);

    const stockRiskPrevious = materials.filter((m: any) => {
        const dailyUse = previousIssueMap.get(String(m._id)) || 0;
        const daysCover = dailyUse > 0 ? m.quantity / dailyUse : Number.POSITIVE_INFINITY;
        return daysCover < 3;
    }).length;

    const stockRiskDelta = deltaPercent(stockRiskCurrent.length, stockRiskPrevious);
    const stockRiskSignal: Signal =
        stockRiskCurrent.length >= 8 ? 'critical' : stockRiskCurrent.length > 0 ? 'warning' : 'good';

    const pendingPiCurrent = await ProductInward.countDocuments({ status: 'RAISED' });
    const pendingPiPrevious = await ProductInward.countDocuments({
        createdAt: { $lte: windowRange.previousEnd },
        $or: [{ status: 'RAISED' }, { approvedAt: { $gt: windowRange.previousEnd } }],
    });
    const pendingPiDelta = deltaPercent(pendingPiCurrent, pendingPiPrevious);
    const pendingPiSignal: Signal =
        pendingPiCurrent >= 10 ? 'critical' : pendingPiCurrent >= 4 ? 'warning' : 'good';

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const delayedInwardCurrent = await ProductInward.countDocuments({
        status: 'APPROVED',
        approvedAt: { $lte: threeDaysAgo },
    });

    const previousReference = new Date(windowRange.previousEnd.getTime() - 3 * 24 * 60 * 60 * 1000);
    const delayedInwardPrevious = await ProductInward.countDocuments({
        createdAt: { $lte: windowRange.previousEnd },
        approvedAt: { $lte: previousReference },
        $or: [{ status: 'APPROVED' }, { completedAt: { $gt: windowRange.previousEnd } }],
    });

    const delayedInwardDelta = deltaPercent(delayedInwardCurrent, delayedInwardPrevious);
    const delayedInwardSignal: Signal =
        delayedInwardCurrent >= 8 ? 'critical' : delayedInwardCurrent > 0 ? 'warning' : 'good';

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const mrsBacklogCurrent = await MRS.countDocuments({
        status: { $in: ['PENDING', 'PARTIALLY_ISSUED'] },
        createdAt: { $lte: oneDayAgo },
    });

    const previousOneDayAgo = new Date(windowRange.previousEnd.getTime() - 24 * 60 * 60 * 1000);
    const mrsBacklogPrevious = await MRS.countDocuments({
        createdAt: { $lte: previousOneDayAgo },
        status: { $in: ['PENDING', 'PARTIALLY_ISSUED'] },
    });

    const mrsBacklogDelta = deltaPercent(mrsBacklogCurrent, mrsBacklogPrevious);
    const mrsBacklogSignal: Signal =
        mrsBacklogCurrent >= 15 ? 'critical' : mrsBacklogCurrent >= 6 ? 'warning' : 'good';

    const materialIdsWithIssueCurrent = await Transaction.distinct('materialId', {
        type: 'ISSUE',
        timestamp: { $gte: windowRange.currentStart, $lte: windowRange.currentEnd },
    });

    const materialIdsWithIssuePrevious = await Transaction.distinct('materialId', {
        type: 'ISSUE',
        timestamp: { $gte: windowRange.previousStart, $lte: windowRange.previousEnd },
    });

    const deadStockCurrentPct = materials.length
        ? ((materials.length - materialIdsWithIssueCurrent.length) / materials.length) * 100
        : 0;
    const deadStockPreviousPct = materials.length
        ? ((materials.length - materialIdsWithIssuePrevious.length) / materials.length) * 100
        : 0;

    const deadStockDelta = deltaPercent(deadStockCurrentPct, deadStockPreviousPct);
    const deadStockSignal: Signal =
        deadStockCurrentPct >= 35 ? 'critical' : deadStockCurrentPct >= 20 ? 'warning' : 'good';

    return [
        {
            id: 'inventory-stockout-risk',
            domain: 'inventory',
            priority: getPriority(stockRiskSignal),
            signal: stockRiskSignal,
            metric: 'Stockout risk (< 3 days cover)',
            currentValue: stockRiskCurrent.length,
            previousValue: stockRiskPrevious,
            deltaPercent: stockRiskDelta,
            trendSignal: getTrendSignal(stockRiskDelta, false),
            reason: stockRiskCurrent.slice(0, 2).map((m) => `${m.name}: ${m.daysCover.toFixed(1)} days cover`),
            recommendedAction: 'Raise PI drafts for the top critical materials immediately.',
            actionLink: '/raise-pi',
            expectedImpact: `Prevents potential delays in up to ${Math.max(stockRiskCurrent.length, 1)} production lines.`,
        },
        {
            id: 'procurement-pi-backlog',
            domain: 'procurement',
            priority: getPriority(pendingPiSignal),
            signal: pendingPiSignal,
            metric: 'PI approvals pending',
            currentValue: pendingPiCurrent,
            previousValue: pendingPiPrevious,
            deltaPercent: pendingPiDelta,
            trendSignal: getTrendSignal(pendingPiDelta, false),
            reason: [
                `${pendingPiCurrent} raised PIs are waiting for approval.`,
                'Delayed approvals slow inward planning and vendor confirmation.',
            ],
            recommendedAction: 'Prioritize PI approvals by material criticality and supplier lead time.',
            actionLink: '/pi-approvals',
            expectedImpact: 'Improves procurement cycle speed and prevents emergency purchases.',
        },
        {
            id: 'procurement-inward-slippage',
            domain: 'procurement',
            priority: getPriority(delayedInwardSignal),
            signal: delayedInwardSignal,
            metric: 'Approved PI inward slippage (> 3 days)',
            currentValue: delayedInwardCurrent,
            previousValue: delayedInwardPrevious,
            deltaPercent: delayedInwardDelta,
            trendSignal: getTrendSignal(delayedInwardDelta, false),
            reason: [
                `${delayedInwardCurrent} approved PIs have not reached inward entry in 3+ days.`,
                'Likely causes: supplier dispatch lag or receiving bottlenecks.',
            ],
            recommendedAction: 'Expedite delayed suppliers and complete inward for approved PIs.',
            actionLink: '/inward-entry',
            expectedImpact: 'Restores material availability and reduces line stoppage risk.',
        },
        {
            id: 'inventory-mrs-backlog',
            domain: 'inventory',
            priority: getPriority(mrsBacklogSignal),
            signal: mrsBacklogSignal,
            metric: 'MRS backlog (> 24h unissued)',
            currentValue: mrsBacklogCurrent,
            previousValue: mrsBacklogPrevious,
            deltaPercent: mrsBacklogDelta,
            trendSignal: getTrendSignal(mrsBacklogDelta, false),
            reason: [
                `${mrsBacklogCurrent} requests are still pending/partially issued after 24h.`,
                'Backlog often indicates picking capacity or stock fragmentation issues.',
            ],
            recommendedAction: 'Issue oldest MRS first and re-prioritize by production urgency.',
            actionLink: '/mrs-list',
            expectedImpact: 'Improves production readiness for pending batches.',
        },
        {
            id: 'inventory-dead-stock-percent',
            domain: 'inventory',
            priority: getPriority(deadStockSignal),
            signal: deadStockSignal,
            metric: 'Dead stock percentage (no issue in selected window)',
            currentValue: Number(deadStockCurrentPct.toFixed(2)),
            previousValue: Number(deadStockPreviousPct.toFixed(2)),
            deltaPercent: deadStockDelta,
            trendSignal: getTrendSignal(deadStockDelta, false),
            reason: [
                `${deadStockCurrentPct.toFixed(1)}% of materials had zero issue movement.`,
                'High dead stock locks working capital and storage space.',
            ],
            recommendedAction: 'Review slow-moving items and rebalance reorder plans.',
            actionLink: '/inventory',
            expectedImpact: 'Improves inventory turns and reduces capital lock-in.',
        },
    ];
};

const getManagerDecisionFeed = async (windowRange: WindowRange): Promise<DecisionFeedItem[]> => {
    const ProductionBatch = mongoose.model('ProductionBatch');

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const ordersAtRiskCurrent = await CustomerOrder.countDocuments({
        deliveryDate: { $lte: threeDaysFromNow },
        status: { $nin: ['COMPLETED', 'DISPATCHED', 'DELIVERED'] },
    });

    const previousThreeDays = new Date(windowRange.previousEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
    const ordersAtRiskPrevious = await CustomerOrder.countDocuments({
        createdAt: { $lte: windowRange.previousEnd },
        deliveryDate: { $lte: previousThreeDays },
        status: { $nin: ['COMPLETED', 'DISPATCHED', 'DELIVERED'] },
    });

    const ordersRiskDelta = deltaPercent(ordersAtRiskCurrent, ordersAtRiskPrevious);
    const ordersRiskSignal: Signal =
        ordersAtRiskCurrent >= 12 ? 'critical' : ordersAtRiskCurrent >= 5 ? 'warning' : 'good';

    const approvalCycleCurrentAgg = await ProductInward.aggregate([
        {
            $match: {
                approvedAt: { $gte: windowRange.currentStart, $lte: windowRange.currentEnd },
                createdAt: { $ne: null },
            },
        },
        {
            $project: {
                days: { $divide: [{ $subtract: ['$approvedAt', '$createdAt'] }, 86400000] },
            },
        },
        { $group: { _id: null, avgDays: { $avg: '$days' } } },
    ]);

    const approvalCyclePreviousAgg = await ProductInward.aggregate([
        {
            $match: {
                approvedAt: { $gte: windowRange.previousStart, $lte: windowRange.previousEnd },
                createdAt: { $ne: null },
            },
        },
        {
            $project: {
                days: { $divide: [{ $subtract: ['$approvedAt', '$createdAt'] }, 86400000] },
            },
        },
        { $group: { _id: null, avgDays: { $avg: '$days' } } },
    ]);

    const approvalCycleCurrent = toNumber(approvalCycleCurrentAgg[0]?.avgDays);
    const approvalCyclePrevious = toNumber(approvalCyclePreviousAgg[0]?.avgDays);
    const approvalCycleDelta = deltaPercent(approvalCycleCurrent, approvalCyclePrevious);
    const approvalCycleSignal: Signal =
        approvalCycleCurrent >= 3 ? 'critical' : approvalCycleCurrent >= 1.5 ? 'warning' : 'good';

    const delayedBatchesCurrent = await ProductionBatch.countDocuments({
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledDate: { $lt: now },
    });

    const delayedBatchesPrevious = await ProductionBatch.countDocuments({
        createdAt: { $lte: windowRange.previousEnd },
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledDate: { $lt: windowRange.previousEnd },
    });

    const delayedBatchDelta = deltaPercent(delayedBatchesCurrent, delayedBatchesPrevious);
    const delayedBatchSignal: Signal =
        delayedBatchesCurrent >= 10 ? 'critical' : delayedBatchesCurrent >= 4 ? 'warning' : 'good';

    const leadVarianceCurrentAgg = await ProductInward.aggregate([
        {
            $match: {
                status: 'COMPLETED',
                completedAt: { $gte: windowRange.currentStart, $lte: windowRange.currentEnd },
                approvedAt: { $ne: null },
            },
        },
        {
            $project: {
                leadDays: { $divide: [{ $subtract: ['$completedAt', '$approvedAt'] }, 86400000] },
            },
        },
        { $group: { _id: null, variance: { $stdDevPop: '$leadDays' } } },
    ]);

    const leadVariancePreviousAgg = await ProductInward.aggregate([
        {
            $match: {
                status: 'COMPLETED',
                completedAt: { $gte: windowRange.previousStart, $lte: windowRange.previousEnd },
                approvedAt: { $ne: null },
            },
        },
        {
            $project: {
                leadDays: { $divide: [{ $subtract: ['$completedAt', '$approvedAt'] }, 86400000] },
            },
        },
        { $group: { _id: null, variance: { $stdDevPop: '$leadDays' } } },
    ]);

    const leadVarianceCurrent = toNumber(leadVarianceCurrentAgg[0]?.variance);
    const leadVariancePrevious = toNumber(leadVariancePreviousAgg[0]?.variance);
    const leadVarianceDelta = deltaPercent(leadVarianceCurrent, leadVariancePrevious);
    const leadVarianceSignal: Signal =
        leadVarianceCurrent >= 2.5 ? 'critical' : leadVarianceCurrent >= 1.2 ? 'warning' : 'good';

    const reworkCurrentAgg = await ProductionBatch.aggregate([
        {
            $match: {
                status: 'COMPLETED',
                endTime: { $gte: windowRange.currentStart, $lte: windowRange.currentEnd },
                inputKg: { $gt: 0 },
            },
        },
        {
            $project: {
                reworkPct: {
                    $multiply: [{ $divide: [{ $ifNull: ['$rejectionKg', 0] }, '$inputKg'] }, 100],
                },
            },
        },
        { $group: { _id: null, avgReworkPct: { $avg: '$reworkPct' } } },
    ]);

    const reworkPreviousAgg = await ProductionBatch.aggregate([
        {
            $match: {
                status: 'COMPLETED',
                endTime: { $gte: windowRange.previousStart, $lte: windowRange.previousEnd },
                inputKg: { $gt: 0 },
            },
        },
        {
            $project: {
                reworkPct: {
                    $multiply: [{ $divide: [{ $ifNull: ['$rejectionKg', 0] }, '$inputKg'] }, 100],
                },
            },
        },
        { $group: { _id: null, avgReworkPct: { $avg: '$reworkPct' } } },
    ]);

    const reworkCurrent = toNumber(reworkCurrentAgg[0]?.avgReworkPct);
    const reworkPrevious = toNumber(reworkPreviousAgg[0]?.avgReworkPct);
    const reworkDelta = deltaPercent(reworkCurrent, reworkPrevious);
    const reworkSignal: Signal = reworkCurrent >= 8 ? 'critical' : reworkCurrent >= 4 ? 'warning' : 'good';

    return [
        {
            id: 'customer-orders-at-risk',
            domain: 'customer',
            priority: getPriority(ordersRiskSignal),
            signal: ordersRiskSignal,
            metric: 'Orders at risk within next 3 days',
            currentValue: ordersAtRiskCurrent,
            previousValue: ordersAtRiskPrevious,
            deltaPercent: ordersRiskDelta,
            trendSignal: getTrendSignal(ordersRiskDelta, false),
            reason: [
                `${ordersAtRiskCurrent} orders are due in <= 3 days and not completed.`,
                'Any material or production delay now directly impacts OTIF commitment.',
            ],
            recommendedAction: 'Expedite critical orders and align dispatch priorities immediately.',
            actionLink: '/customer-orders',
            expectedImpact: 'Reduces late-delivery exposure and protects customer SLA.',
        },
        {
            id: 'procurement-approval-cycle-time',
            domain: 'procurement',
            priority: getPriority(approvalCycleSignal),
            signal: approvalCycleSignal,
            metric: 'PI approval cycle time (days)',
            currentValue: Number(approvalCycleCurrent.toFixed(2)),
            previousValue: Number(approvalCyclePrevious.toFixed(2)),
            deltaPercent: approvalCycleDelta,
            trendSignal: getTrendSignal(approvalCycleDelta, false),
            reason: [
                `${approvalCycleCurrent.toFixed(2)} days average from raise to approval.`,
                'Longer cycle time increases material uncertainty and procurement lag.',
            ],
            recommendedAction: 'Fast-track approvals for low-cover and high-value materials.',
            actionLink: '/pi-approvals',
            expectedImpact: 'Improves procurement responsiveness and planning confidence.',
        },
        {
            id: 'production-delayed-batches',
            domain: 'production',
            priority: getPriority(delayedBatchSignal),
            signal: delayedBatchSignal,
            metric: 'Delayed batches (scheduled but not completed)',
            currentValue: delayedBatchesCurrent,
            previousValue: delayedBatchesPrevious,
            deltaPercent: delayedBatchDelta,
            trendSignal: getTrendSignal(delayedBatchDelta, false),
            reason: [
                `${delayedBatchesCurrent} batches are behind schedule.`,
                'Root causes are usually machine downtime, staffing mismatch, or material latency.',
            ],
            recommendedAction: 'Reassign machine/shift capacity to at-risk high-priority batches.',
            actionLink: '/production/monitor',
            expectedImpact: 'Recovers throughput and lowers customer order spillover risk.',
        },
        {
            id: 'procurement-supplier-lead-variance',
            domain: 'procurement',
            priority: getPriority(leadVarianceSignal),
            signal: leadVarianceSignal,
            metric: 'Supplier lead-time variance (days std dev)',
            currentValue: Number(leadVarianceCurrent.toFixed(2)),
            previousValue: Number(leadVariancePrevious.toFixed(2)),
            deltaPercent: leadVarianceDelta,
            trendSignal: getTrendSignal(leadVarianceDelta, false),
            reason: [
                `${leadVarianceCurrent.toFixed(2)} days lead variance in completed PIs.`,
                'High variance weakens production planning reliability.',
            ],
            recommendedAction: 'Prefer suppliers with stable delivery and rebalance allocation.',
            actionLink: '/procurement',
            expectedImpact: 'Improves forecast reliability and reduces emergency procurement.',
        },
        {
            id: 'production-rework-percent',
            domain: 'production',
            priority: getPriority(reworkSignal),
            signal: reworkSignal,
            metric: 'Average rework %',
            currentValue: Number(reworkCurrent.toFixed(2)),
            previousValue: Number(reworkPrevious.toFixed(2)),
            deltaPercent: reworkDelta,
            trendSignal: getTrendSignal(reworkDelta, false),
            reason: [
                `${reworkCurrent.toFixed(2)}% average rejection against input in completed batches.`,
                'Higher rework indicates quality drift and avoidable cost leakage.',
            ],
            recommendedAction: 'Run root-cause review for top loss batches and enforce control limits.',
            actionLink: '/analytics/production',
            expectedImpact: 'Protects yield, margin, and delivery reliability.',
        },
    ];
};

const getAdminDecisionFeed = async (windowRange: WindowRange): Promise<DecisionFeedItem[]> => {
    const managerFeed = await getManagerDecisionFeed(windowRange);
    const storeFeed = await getStoreManagerDecisionFeed(windowRange);
    return [...managerFeed, ...storeFeed].sort((a, b) => a.priority - b.priority).slice(0, 8);
};

export const getDecisionFeed = async (role: DecisionRole, windowKey?: string) => {
    const windowRange = resolveWindow(windowKey);
    const cacheKey = getCacheKey(role, windowRange.key);
    const cached = decisionFeedCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.payload;
    }

    let items: DecisionFeedItem[] = [];
    if (role === 'STORE_MANAGER') {
        items = await getStoreManagerDecisionFeed(windowRange);
    } else if (role === 'MANAGER') {
        items = await getManagerDecisionFeed(windowRange);
    } else if (role === 'SUPERVISOR') {
        const managerFeed = await getManagerDecisionFeed(windowRange);
        items = managerFeed.filter((item) => item.domain === 'production');
    } else {
        items = await getAdminDecisionFeed(windowRange);
    }

    const sorted = items.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent);
    });

    const payload: DecisionFeedResponse = {
        role,
        window: windowRange.key,
        windowLabel: windowRange.label,
        generatedAt: new Date().toISOString(),
        topActions: sorted.filter((item) => item.signal !== 'good').slice(0, 5),
        decisions: sorted,
    };

    decisionFeedCache.set(cacheKey, {
        payload,
        expiresAt: Date.now() + FEED_CACHE_TTL_MS,
    });

    await persistDailySnapshot(role, windowRange.key, payload);

    return payload;
};

export const getKpiDictionary = () => {
    return {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        windows: ['7d', '30d', '90d', 'MTD', 'QTD'],
        kpis: KPI_DICTIONARY_BASE,
    };
};

export const getKpiFormulaVersions = async () => {
    const latestRows = await MetricFormulaVersion.aggregate([
        { $sort: { metricId: 1, version: -1, createdAt: -1 } },
        {
            $group: {
                _id: '$metricId',
                latest: { $first: '$$ROOT' },
            },
        },
        { $replaceRoot: { newRoot: '$latest' } },
        { $sort: { metricId: 1 } },
    ]);

    return latestRows;
};

export const ensureKpiFormulaVersionsSeeded = async () => {
    for (const kpi of KPI_DICTIONARY_BASE) {
        const existing = await MetricFormulaVersion.findOne({ metricId: kpi.id }).lean();
        if (!existing) {
            await MetricFormulaVersion.create({
                metricId: kpi.id,
                version: 1,
                formula: kpi.formula,
                thresholds: kpi.thresholds,
                desiredDirection: kpi.desiredDirection,
                roles: kpi.roles,
                changeNote: 'Initial KPI baseline',
            });
        }
    }
};

export const upsertKpiFormulaVersion = async (payload: {
    metricId: string;
    formula: string;
    thresholds?: { warning?: string; critical?: string };
    desiredDirection: 'up' | 'down';
    roles: string[];
    changedBy?: string;
    changeNote?: string;
}) => {
    const latest = await MetricFormulaVersion.findOne({ metricId: payload.metricId })
        .sort({ version: -1 })
        .lean();

    const nextVersion = latest ? latest.version + 1 : 1;
    return MetricFormulaVersion.create({
        ...payload,
        version: nextVersion,
    });
};

export const getLatestDecisionSnapshots = async (role?: DecisionRole, window?: AnalyticsWindow) => {
    const query: Record<string, any> = {};
    if (role) query.role = role;
    if (window) query.window = window;

    return AnalyticsSnapshot.find(query)
        .sort({ snapshotDate: -1 })
        .limit(30)
        .lean();
};

const toDateString = (value: any) => (value ? new Date(value).toLocaleDateString() : '-');

export const getDecisionDrilldown = async (decisionId: string, windowKey?: string): Promise<DecisionDrilldownResponse> => {
    const windowRange = resolveWindow(windowKey);
    const ProductionBatch = mongoose.model('ProductionBatch');

    if (decisionId === 'inventory-stockout-risk') {
        const materials = await Material.find().select('name quantity minStock unit').lean();
        const issueMap = await buildIssueMap(windowRange.currentStart, windowRange.currentEnd);
        const rows = materials
            .map((m: any) => {
                const dailyUse = issueMap.get(String(m._id)) || 0;
                const daysCover = dailyUse > 0 ? m.quantity / dailyUse : Number.POSITIVE_INFINITY;
                return {
                    materialId: m._id,
                    name: m.name,
                    quantity: m.quantity,
                    minStock: m.minStock,
                    avgDailyUse: Number(dailyUse.toFixed(2)),
                    daysCover: Number.isFinite(daysCover) ? Number(daysCover.toFixed(1)) : 'No usage',
                    actionLink: `/inventory/${m._id}`,
                };
            })
            .filter((r: any) => typeof r.daysCover === 'number' && r.daysCover < 3)
            .sort((a: any, b: any) => a.daysCover - b.daysCover)
            .slice(0, 100);

        return {
            decisionId,
            title: 'Stockout risk details',
            columns: [
                { key: 'name', label: 'Material' },
                { key: 'quantity', label: 'Current' },
                { key: 'minStock', label: 'Min' },
                { key: 'avgDailyUse', label: 'Avg Daily Use' },
                { key: 'daysCover', label: 'Days Cover' },
            ],
            rows,
        };
    }

    if (decisionId === 'procurement-pi-backlog') {
        const rows = await ProductInward.find({ status: 'RAISED' })
            .sort({ createdAt: 1 })
            .limit(100)
            .populate('supplierId', 'name')
            .lean();

        return {
            decisionId,
            title: 'Pending PI approvals',
            columns: [
                { key: 'supplier', label: 'Supplier' },
                { key: 'createdAt', label: 'Raised On' },
                { key: 'ageDays', label: 'Age (Days)' },
                { key: 'status', label: 'Status' },
            ],
            rows: rows.map((r: any) => ({
                id: r._id,
                supplier: r.supplierId?.name || '-',
                createdAt: toDateString(r.createdAt),
                ageDays: Math.max(0, Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000)),
                status: r.status,
                actionLink: '/pi-approvals',
            })),
        };
    }

    if (decisionId === 'production-delayed-batches') {
        const now = new Date();
        const rows = await ProductionBatch.find({
            status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
            scheduledDate: { $lt: now },
        })
            .sort({ scheduledDate: 1 })
            .limit(100)
            .populate('machineId', 'name machineCode')
            .lean();

        return {
            decisionId,
            title: 'Delayed batch list',
            columns: [
                { key: 'batchNumber', label: 'Batch' },
                { key: 'machine', label: 'Machine' },
                { key: 'scheduledDate', label: 'Scheduled' },
                { key: 'status', label: 'Status' },
                { key: 'delayDays', label: 'Delay (Days)' },
            ],
            rows: rows.map((r: any) => ({
                id: r._id,
                batchNumber: r.batchNumber,
                machine: r.machineId?.name || r.machineId?.machineCode || '-',
                scheduledDate: toDateString(r.scheduledDate),
                status: r.status,
                delayDays: Math.max(0, Math.floor((Date.now() - new Date(r.scheduledDate).getTime()) / 86400000)),
                actionLink: '/production/monitor',
            })),
        };
    }

    if (decisionId === 'customer-orders-at-risk') {
        const threeDaysFromNow = new Date(Date.now() + 3 * 86400000);
        const rows = await CustomerOrder.find({
            deliveryDate: { $lte: threeDaysFromNow },
            status: { $nin: ['COMPLETED', 'DISPATCHED', 'DELIVERED'] },
        })
            .sort({ deliveryDate: 1 })
            .limit(100)
            .populate('customerId', 'companyName name')
            .lean();

        return {
            decisionId,
            title: 'Orders at late-delivery risk',
            columns: [
                { key: 'orderNumber', label: 'Order #' },
                { key: 'customer', label: 'Customer' },
                { key: 'deliveryDate', label: 'Delivery Date' },
                { key: 'status', label: 'Status' },
                { key: 'totalValue', label: 'Value' },
            ],
            rows: rows.map((r: any) => ({
                id: r._id,
                orderNumber: r.orderNumber,
                customer: r.customerId?.companyName || r.customerId?.name || '-',
                deliveryDate: toDateString(r.deliveryDate),
                status: r.status,
                totalValue: r.totalValue,
                actionLink: '/customer-orders',
            })),
        };
    }

    if (decisionId === 'procurement-supplier-lead-variance') {
        const supplierStats = await ProductInward.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    approvedAt: { $ne: null },
                    completedAt: { $gte: windowRange.currentStart, $lte: windowRange.currentEnd },
                },
            },
            {
                $project: {
                    supplierId: 1,
                    leadDays: { $divide: [{ $subtract: ['$completedAt', '$approvedAt'] }, 86400000] },
                },
            },
            {
                $group: {
                    _id: '$supplierId',
                    poCount: { $sum: 1 },
                    avgLeadDays: { $avg: '$leadDays' },
                    stdDevLeadDays: { $stdDevPop: '$leadDays' },
                },
            },
            { $sort: { stdDevLeadDays: -1 } },
            { $limit: 100 },
        ]);

        const suppliers = await Supplier.find({
            _id: { $in: supplierStats.map((s) => s._id).filter(Boolean) },
        })
            .select('name')
            .lean();
        const supplierMap = new Map(suppliers.map((s: any) => [String(s._id), s.name]));

        return {
            decisionId,
            title: 'Supplier lead-time variance',
            columns: [
                { key: 'supplier', label: 'Supplier' },
                { key: 'poCount', label: 'PO Count' },
                { key: 'avgLeadDays', label: 'Avg Lead (Days)' },
                { key: 'stdDevLeadDays', label: 'Variance (StdDev)' },
            ],
            rows: supplierStats.map((s: any) => ({
                supplier: supplierMap.get(String(s._id)) || 'Unknown Supplier',
                poCount: s.poCount,
                avgLeadDays: Number(toNumber(s.avgLeadDays).toFixed(2)),
                stdDevLeadDays: Number(toNumber(s.stdDevLeadDays).toFixed(2)),
                actionLink: '/procurement',
            })),
        };
    }

    return {
        decisionId,
        title: 'Decision drill-down',
        columns: [
            { key: 'metric', label: 'Metric' },
            { key: 'note', label: 'Note' },
        ],
        rows: [{ metric: decisionId, note: 'Detailed drill-down is not configured for this decision yet.' }],
    };
};

export const getDataQualitySummary = async () => {
    const now = new Date();

    const [
        piMissingApprovedAt,
        piMissingCompletedAt,
        piInvalidTimeline,
        batchInvalidTimeline,
        mrsWithoutItems,
        transactionsWithoutRelated,
        overduePlacedOrders,
    ] = await Promise.all([
        ProductInward.countDocuments({
            status: { $in: ['APPROVED', 'COMPLETED'] },
            approvedAt: { $exists: false },
        }),
        ProductInward.countDocuments({
            status: 'COMPLETED',
            completedAt: { $exists: false },
        }),
        ProductInward.countDocuments({
            approvedAt: { $exists: true },
            completedAt: { $exists: true },
            $expr: { $lt: ['$completedAt', '$approvedAt'] },
        }),
        mongoose.model('ProductionBatch').countDocuments({
            startTime: { $exists: true },
            endTime: { $exists: true },
            $expr: { $lt: ['$endTime', '$startTime'] },
        }),
        MRS.countDocuments({
            $or: [{ items: { $exists: false } }, { items: { $size: 0 } }],
        }),
        Transaction.countDocuments({
            type: { $in: ['ISSUE', 'INWARD'] },
            relatedId: { $exists: false },
        }),
        CustomerOrder.countDocuments({
            deliveryDate: { $lt: now },
            status: 'PLACED',
        }),
    ]);

    const checks = [
        {
            key: 'pi-missing-approved-at',
            label: 'Approved/Completed PI missing approvedAt',
            issueCount: piMissingApprovedAt,
            severity: piMissingApprovedAt > 0 ? 'warning' : 'good',
        },
        {
            key: 'pi-missing-completed-at',
            label: 'Completed PI missing completedAt',
            issueCount: piMissingCompletedAt,
            severity: piMissingCompletedAt > 0 ? 'warning' : 'good',
        },
        {
            key: 'pi-invalid-timeline',
            label: 'PI timeline invalid (completedAt < approvedAt)',
            issueCount: piInvalidTimeline,
            severity: piInvalidTimeline > 0 ? 'critical' : 'good',
        },
        {
            key: 'batch-invalid-timeline',
            label: 'Production batch invalid timeline (end < start)',
            issueCount: batchInvalidTimeline,
            severity: batchInvalidTimeline > 0 ? 'critical' : 'good',
        },
        {
            key: 'mrs-without-items',
            label: 'MRS records without line items',
            issueCount: mrsWithoutItems,
            severity: mrsWithoutItems > 0 ? 'warning' : 'good',
        },
        {
            key: 'transactions-without-related',
            label: 'Transactions missing related record reference',
            issueCount: transactionsWithoutRelated,
            severity: transactionsWithoutRelated > 0 ? 'warning' : 'good',
        },
        {
            key: 'overdue-placed-orders',
            label: 'Orders overdue but still in PLACED state',
            issueCount: overduePlacedOrders,
            severity: overduePlacedOrders > 0 ? 'warning' : 'good',
        },
    ];

    const totalIssues = checks.reduce((sum, c) => sum + c.issueCount, 0);

    return {
        generatedAt: new Date().toISOString(),
        totalIssues,
        checks,
    };
};
