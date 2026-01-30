import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

interface AuthRequest extends Request {
    user?: any;
}

// Helper to create notification internally
export const sendNotification = async (recipientId: string, message: string, type: string = 'INFO', link?: string) => {
    try {
        await Notification.create({ recipient: recipientId, message, type, link });
    } catch (error) {
        console.error('Failed to create notification', error);
    }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20); // Last 20
        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });

        res.json({ notifications, unreadCount });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { read: true });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
