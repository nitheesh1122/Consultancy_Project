import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Material } from '../models/Material';

export const getMaterialHistory = async (req: Request, res: Response) => {
    const { materialId } = req.params;
    try {
        const transactions = await Transaction.find({ materialId })
            .populate('performedBy', 'username')
            // .populate('relatedId') // Could be MRS or PI, dynamic ref might need care
            .sort({ timestamp: -1 });

        const material = await Material.findById(materialId).select('name unit');

        res.json({ material, transactions });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
