import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MRS } from '../models/MRS';

interface AuthRequest extends Request {
    user?: any;
}

export const createMRS = async (req: AuthRequest, res: Response) => {
    const { batchId, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items requested' });
    }

    try {
        const mrs = await MRS.create({
            batchId,
            supervisorId: req.user.id,
            items,
            status: 'PENDING'
        });

        res.status(201).json(mrs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyMRS = async (req: AuthRequest, res: Response) => {
    try {
        const mrsList = await MRS.find({ supervisorId: req.user.id })
            .populate('items.materialId', 'name unit')
            .sort({ createdAt: -1 });
        res.json(mrsList);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getPendingMRS = async (req: AuthRequest, res: Response) => {
    try {
        const mrsList = await MRS.find({ status: { $in: ['PENDING', 'PARTIALLY_ISSUED'] } })
            .populate('items.materialId', 'name unit quantity')
            .populate('supervisorId', 'username')
            .sort({ createdAt: 1 });
        res.json(mrsList);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const issueMRS = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { itemsIssue } = req.body; // Array of { materialId, quantityIssued }

    try {
        const mrs = await MRS.findById(id).populate('items.materialId');
        if (!mrs) {
            return res.status(404).json({ message: 'MRS not found' });
        }

        if (mrs.status === 'ISSUED') {
            return res.status(400).json({ message: 'MRS already issued' });
        }

        // Process each item
        for (const issueItem of itemsIssue) {
            const mrsItem = mrs.items.find((i: any) => i.materialId._id.toString() === issueItem.materialId);

            if (mrsItem) {
                // Update stock
                await mongoose.connection.collection('materials').updateOne(
                    { _id: new mongoose.Types.ObjectId(issueItem.materialId) },
                    { $inc: { quantity: -issueItem.quantityIssued } }
                );

                // Create Transaction
                await mongoose.connection.collection('transactions').insertOne({
                    id: new mongoose.Types.ObjectId().toString(),
                    type: 'ISSUE',
                    materialId: new mongoose.Types.ObjectId(issueItem.materialId),
                    quantity: -issueItem.quantityIssued, // Negative for issue
                    relatedId: mrs._id,
                    performedBy: new mongoose.Types.ObjectId(req.user.id),
                    timestamp: new Date()
                });

                // Update MRS Item issued quantity
                mrsItem.quantityIssued = (mrsItem.quantityIssued || 0) + issueItem.quantityIssued;
            }
        }

        // Check if fully issued
        const allIssued = mrs.items.every((item: any) => item.quantityIssued >= item.quantityRequested);
        mrs.status = allIssued ? 'ISSUED' : 'PARTIALLY_ISSUED';

        await mrs.save();

        res.json(mrs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
