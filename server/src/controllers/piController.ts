import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductInward } from '../models/ProductInward';

interface AuthRequest extends Request {
    user?: any;
}

// 1. Raise PI (Store Manager)
export const createPI = async (req: AuthRequest, res: Response) => {
    const { items, reason } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items requested' });
    }

    try {
        const pi = await ProductInward.create({
            storeManagerId: req.user.id,
            items,
            reason,
            status: 'RAISED'
        });
        res.status(201).json(pi);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Get All PIs (Admin views all, Manager views own)
export const getPIs = async (req: AuthRequest, res: Response) => {
    try {
        let query = {};
        if (req.user.role === 'STORE_MANAGER') {
            // Manager sees what they raised, or all? Usually all for visibility, 
            // but let's stick to generally viewing all or recent.
            // Requirement says "Admin reviews all RAISED PI".
        }

        const pis = await ProductInward.find(query)
            .populate('items.materialId', 'name unit')
            .populate('storeManagerId', 'username')
            .sort({ createdAt: -1 });
        res.json(pis);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Approve/Reject PI (Admin)
export const updatePIStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const pi = await ProductInward.findById(id);
        if (!pi) return res.status(404).json({ message: 'PI not found' });

        if (pi.status !== 'RAISED') {
            return res.status(400).json({ message: 'PI is already processed' });
        }

        pi.status = status;
        pi.adminId = req.user.id;
        if (reason) pi.reason = reason; // Optional rejection reason or note

        await pi.save();
        res.json(pi);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Inward Entry (Store Manager) - Converts Approved PI to Actual Stock
export const processInward = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { itemsReceived } = req.body; // Optional: if partial, but let's assume full for V1 or mapped

    // For simplicity V1: We assume the Inward matches the Approved PI quantities exactly 
    // or user confirms them. Let's just use the PI items for now to update stock.

    try {
        const pi = await ProductInward.findById(id).populate('items.materialId');
        if (!pi) return res.status(404).json({ message: 'PI not found' });

        if (pi.status !== 'APPROVED') {
            return res.status(400).json({ message: 'PI must be APPROVED before Inward Entry' });
        }

        // Update Stock & Create Transactions
        for (const item of pi.items) {
            // Update Stock
            await mongoose.connection.collection('materials').updateOne(
                { _id: item.materialId._id },
                { $inc: { quantity: item.quantity } }
            );

            // Transaction Log
            await mongoose.connection.collection('transactions').insertOne({
                id: new mongoose.Types.ObjectId().toString(),
                type: 'INWARD',
                materialId: item.materialId._id,
                quantity: item.quantity, // Positive for inward
                relatedId: pi._id,
                performedBy: new mongoose.Types.ObjectId(req.user.id),
                timestamp: new Date()
            });
        }

        pi.status = 'COMPLETED';
        pi.completedAt = new Date();
        await pi.save();

        res.json({ message: 'Inward entry successful, stock updated', pi });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
