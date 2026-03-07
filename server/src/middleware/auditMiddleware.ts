import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

interface AuthRequest extends Request {
    user?: any;
}

/**
 * logAudit middleware — records an audit entry.
 * Works both BEFORE the controller (for authenticated routes where req.user is set by protect middleware)
 * and can capture the body/query context for logging purposes.
 */
export const logAudit = (action: string) => async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // For authenticated routes, req.user is already populated by 'protect' middleware.
        // For login, we hook into res.json to capture the userId from the response.
        if (req.user) {
            // Standard authenticated route — log immediately
            await AuditLog.create({
                action,
                userId: req.user.id,
                details: {
                    method: req.method,
                    path: req.path,
                    body: (req.method === 'POST' || req.method === 'PUT') ? sanitizeBody(req.body) : undefined,
                    query: Object.keys(req.query).length ? req.query : undefined,
                    params: Object.keys(req.params).length ? req.params : undefined,
                },
                ipAddress: req.ip
            });
        } else {
            // Unauthenticated route (e.g., login) — hook into res.json to get user info from response
            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                // After successful login the response contains user data
                if (body && body.user && body.user._id) {
                    AuditLog.create({
                        action,
                        userId: body.user._id,
                        details: {
                            method: req.method,
                            path: req.path,
                            username: body.user.username,
                            role: body.user.role,
                        },
                        ipAddress: req.ip
                    }).catch((err: Error) => console.error('Audit Log Error:', err));
                }
                return originalJson(body);
            };
        }
    } catch (error) {
        console.error('Audit Log Error:', error);
    }

    next();
};

/**
 * manualLog — for programmatic logging from controllers.
 */
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
};

/**
 * Strip sensitive fields from request body before logging.
 */
function sanitizeBody(body: any): any {
    if (!body) return undefined;
    const { password, token, secret, ...safe } = body;
    return safe;
}
