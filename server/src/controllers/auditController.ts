import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

// Map of action prefixes to module names for grouping
const ACTION_MODULE_MAP: Record<string, string> = {
    USER_LOGIN: 'Authentication',
    USER_REGISTERED: 'Authentication',
    USER_DELETED: 'Authentication',
    MATERIAL_ADDED: 'Inventory',
    MATERIAL_UPDATED: 'Inventory',
    MATERIAL_DELETED: 'Inventory',
    MRS_CREATED: 'Procurement',
    MRS_ISSUED: 'Procurement',
    MRS_REJECTED: 'Procurement',
    MATERIAL_RETURNED: 'Procurement',
    PI_RAISED: 'Procurement',
    PI_STATUS_UPDATED: 'Procurement',
    INWARD_PROCESSED: 'Procurement',
    BATCH_CREATED: 'Production',
    BATCH_STARTED: 'Production',
    BATCH_COMPLETED: 'Production',
};

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const {
            action,
            search,
            startDate,
            endDate,
            page = '1',
            limit = '50',
        } = req.query as Record<string, string>;

        const filter: Record<string, any> = {};

        if (action && action !== 'ALL') {
            filter.action = action;
        }

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = end;
            }
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        let query = AuditLog.find(filter)
            .populate('userId', 'username role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum);

        let [logs, total] = await Promise.all([
            query.exec(),
            AuditLog.countDocuments(filter)
        ]);

        // Apply search filter in memory (because userId is populated after query)
        if (search) {
            const searchLower = search.toLowerCase();
            logs = logs.filter(log =>
                log.action.toLowerCase().includes(searchLower) ||
                (log.userId as any)?.username?.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            logs,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const exportAuditLogsCSV = async (req: Request, res: Response) => {
    try {
        const { action, search, startDate, endDate } = req.query as Record<string, string>;

        const filter: Record<string, any> = {};
        if (action && action !== 'ALL') filter.action = action;
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = end;
            }
        }

        let logs = await AuditLog.find(filter)
            .populate('userId', 'username role')
            .sort({ timestamp: -1 })
            .limit(5000);

        if (search) {
            const s = search.toLowerCase();
            logs = logs.filter(l =>
                l.action.toLowerCase().includes(s) ||
                (l.userId as any)?.username?.toLowerCase().includes(s)
            );
        }

        const rows = [
            ['Timestamp', 'User', 'Role', 'Action', 'Module', 'IP Address', 'Details'],
            ...logs.map(l => {
                const user = l.userId as any;
                const module = ACTION_MODULE_MAP[l.action] || 'System';
                const details = l.details ? JSON.stringify(l.details).replace(/"/g, "'") : '';
                return [
                    new Date(l.timestamp).toLocaleString(),
                    user?.username || 'System',
                    user?.role || 'N/A',
                    l.action,
                    module,
                    l.ipAddress || '-',
                    details
                ];
            })
        ];

        const csv = rows.map(r => r.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
        res.send(csv);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
