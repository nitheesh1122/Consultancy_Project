import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductInward } from '../models/ProductInward';

interface AuthRequest extends Request {
    user?: any;
}

import { Material } from '../models/Material';
import { Transaction } from '../models/Transaction';

// 1. Raise PI (Store Manager)
export const createPI = async (req: AuthRequest, res: Response) => {
    const { items, reason } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items requested' });
    }

    try {
        // Fetch materials to get supplierIds
        const materialIds = items.map((i: any) => i.materialId);
        const materials = await Material.find({ _id: { $in: materialIds } });

        const materialMap = new Map(materials.map(m => [m._id.toString(), m]));

        // Group items by Supplier
        const piGroups: Record<string, any[]> = {};

        for (const item of items) {
            const material = materialMap.get(item.materialId);
            if (!material) continue; // Should not happen if frontend is synced

            const supplierId = material.supplierId?.toString();

            if (!supplierId) {
                return res.status(400).json({
                    message: `Material ${material.name} does not have an assigned supplier. Please contact admin.`
                });
            }

            if (!piGroups[supplierId]) {
                piGroups[supplierId] = [];
            }
            piGroups[supplierId].push(item);
        }

        const createdPIs = [];

        // Create PI for each supplier group
        for (const [supplierId, groupItems] of Object.entries(piGroups)) {
            const pi = await ProductInward.create({
                storeManagerId: req.user.id,
                supplierId: supplierId,
                items: groupItems,
                reason,
                status: 'RAISED'
            });
            createdPIs.push(pi);
        }

        res.status(201).json(createdPIs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Get All PIs (Admin views all, Manager views own)
export const getPIs = async (req: AuthRequest, res: Response) => {
    try {
        let query = {};
        if (req.user.role === 'STORE_MANAGER') {
            (query as any).storeManagerId = req.user.id;
        }

        const pis = await ProductInward.find(query)
            .populate('items.materialId', 'name unit')
            .populate('storeManagerId', 'username')
            .populate('supplierId', 'name')
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

    try {
        const pi = await ProductInward.findById(id).populate('items.materialId');
        if (!pi) return res.status(404).json({ message: 'PI not found' });

        if (pi.status !== 'APPROVED') {
            return res.status(400).json({ message: 'PI must be APPROVED before Inward Entry' });
        }

        // Update Stock & Create Transactions
        for (const item of pi.items) {
            const materialId = item.materialId._id || item.materialId; // Handle populated vs unpopulated

            // Update Stock
            await Material.findByIdAndUpdate(
                materialId,
                { $inc: { quantity: item.quantity } }
            );

            // Transaction Log
            await Transaction.create({
                type: 'INWARD',
                materialId: materialId,
                quantity: item.quantity,
                relatedId: pi._id,
                performedBy: req.user.id,
                timestamp: new Date()
            });
        }

        pi.status = 'COMPLETED';
        pi.completedAt = new Date();
        const updatedPI = await pi.save();

        res.json({ message: 'Inward entry successful, stock updated', pi: updatedPI });
    } catch (error: any) {
        console.error("Process Inward Error:", error);
        res.status(500).json({ message: error.message });
    }
};
