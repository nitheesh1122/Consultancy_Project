import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MRS } from '../models/MRS';
import { Material } from '../models/Material';

interface AuthRequest extends Request {
    user?: any;
}

export const createMRS = async (req: AuthRequest, res: Response) => {
    const { batchId, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items requested' });
    }

    try {
        // Validation: Check stock for each item
        const materialIds = items.map((i: any) => i.materialId);
        const materials = await Material.find({ _id: { $in: materialIds } });
        const materialMap = new Map(materials.map(m => [m._id.toString(), m]));

        for (const item of items) {
            const material = materialMap.get(item.materialId);
            if (!material) {
                return res.status(400).json({ message: `Material with ID ${item.materialId} not found` });
            }
            if (item.quantityRequested > material.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${material.name}. Required: ${item.quantityRequested}, Available: ${material.quantity}`
                });
            }
        }

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


        // First, validate all items - ensure sufficient stock exists for ALL before modifying ANY
        for (const issueItem of itemsIssue) {
            // Fetch latest material data inside loop to ensure strict consistency (or fetch all at once, but distinct lock is safer)
            const material = await Material.findById(issueItem.materialId);
            if (!material) return res.status(404).json({ message: `Material ${issueItem.materialId} not found` });

            if (material.quantity < issueItem.quantityIssued) {
                return res.status(400).json({
                    message: `Insufficient stock for ${material.name}. Available: ${material.quantity}, Trying to issue: ${issueItem.quantityIssued}`
                });
            }
        }

        // Process each item
        for (const issueItem of itemsIssue) {
            const mrsItem = mrs.items.find((i: any) => i.materialId._id.toString() === issueItem.materialId);

            if (mrsItem) {
                // Update stock using Model
                await Material.findByIdAndUpdate(
                    issueItem.materialId,
                    { $inc: { quantity: -issueItem.quantityIssued } }
                );

                // Create Transaction using Model - Assuming Transaction model is imported in other task context or raw for now if not imported. 
                // Let's use raw here to match context or add import if needed. Since I added Material import, I should check if Transaction is imported.
                // It is NOT imported in the file view provided earlier. I will use raw collection for Transaction OR add import.
                // Safest to keep raw for Transaction unless I add import, BUT I previously refactored piController to use Model.
                // Let's stick to raw for Transaction to minimize diff, but use Material model for critical stock update.

                // Wait, user complained "backend is sucking". I should make it robust.
                // I'll stick to raw for transaction to avoid breaking, but Material update MUST be correct.

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
