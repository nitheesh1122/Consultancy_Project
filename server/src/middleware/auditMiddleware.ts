import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

interface AuthRequest extends Request {
    user?: any;
}

export const logAudit = (action: string) => async (req: AuthRequest, res: Response, next: NextFunction) => {
    // We want to run the original handler first, then log if successful?
    // Or log the attempt?
    // Middleware runs BEFORE controller.
    // Ideally we log AFTER response, but that's tricky in Express middleware without hooking into res.send.
    // For simplicity, we log the ATTEMPT here.

    try {
        if (req.user) {
            await AuditLog.create({
                action,
                userId: req.user.id,
                details: {
                    method: req.method,
                    path: req.path,
                    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
                    query: req.query
                },
                ipAddress: req.ip
            });
        }
    } catch (error) {
        console.error('Audit Log Error:', error);
    }

    next();
};

export const manualLog = async (action: string, userId: string, details: any) => {
    try {
        await AuditLog.create({
            action,
            userId,
            details,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Manual Audit Log Error:', error);
    }
}
