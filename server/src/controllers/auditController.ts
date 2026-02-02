import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const logs = await AuditLog.find()
            .populate('userId', 'username role')
            .sort({ timestamp: -1 })
            .limit(100); // Limit to last 100 for now
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
