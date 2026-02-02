import { Request, Response } from 'express';
import { Material } from '../models/Material';
import { Transaction } from '../models/Transaction';
import { ProductInward } from '../models/ProductInward';
import { Supplier } from '../models/Supplier';

export const getMaterials = async (req: Request, res: Response) => {
    try {
        const materials = await Material.find({}).populate('supplierId', 'name').sort({ name: 1 });
        res.json(materials);
    } catch (error: any) {
        console.error("Error in getMaterials:", error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
}


export const getProcurementContext = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const material = await Material.findById(id);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Find last INWARD transaction
        const lastInwardTransaction = await Transaction.findOne({
            materialId: id,
            type: 'INWARD'
        }).sort({ timestamp: -1 });

        let context = {
            material: {
                name: material.name,
                code: material.code,
                category: material.category,
                quantity: material.quantity,
                minStock: material.minStock,
                unit: material.unit
            },
            status: 'NEVER_ORDERED',
            lastInward: null as any,
            contextNote: ''
        };

        // Determine Context Note
        if (material.quantity <= material.minStock) {
            context.contextNote = 'Stock is approaching minimum level. Review procurement.';
        } else if (material.quantity === 0) { // Assuming 0 is bad, but effectively covered by low stock
            context.contextNote = 'Stock is critically low (0). Immediate action required.';
        } else if (material.quantity > material.minStock * 5) { // Arbitrary "High" threshold for dead stock context
            context.contextNote = 'Material not used recently. Verify future requirement.';
        }

        if (lastInwardTransaction && lastInwardTransaction.relatedId) {
            context.status = 'ORDERED_BEFORE';

            // Fetch PI details
            const pi = await ProductInward.findById(lastInwardTransaction.relatedId).populate('supplierId');

            if (pi) {
                const supplier = pi.supplierId as any;
                context.lastInward = {
                    date: lastInwardTransaction.timestamp,
                    quantity: lastInwardTransaction.quantity,
                    supplierName: supplier ? supplier.name : 'Unknown Supplier', // Handle deleted supplier
                    piRef: pi._id.toString().slice(-6).toUpperCase() // Pseudo-ref
                };
            }
        }

        res.json(context);

    } catch (error: any) {
        console.error("Error in getProcurementContext:", error);
        res.status(500).json({ message: error.message });
    }
};

export const calculateABC = async (req: Request, res: Response) => {
    try {
        const materials = await Material.find({});
        if (materials.length === 0) return res.status(200).json({ message: 'No materials to analyze' });

        // Calculate value for each material
        const materialValues = materials.map(m => ({
            id: m._id,
            value: (m.quantity || 0) * (m.unitCost || 0)
        }));

        // Sort by value descending
        materialValues.sort((a, b) => b.value - a.value);

        const totalValue = materialValues.reduce((sum, m) => sum + m.value, 0);

        // If total value is 0 (e.g. no costs set), assign all to C or None
        if (totalValue === 0) {
            return res.status(200).json({ message: 'Total inventory value is 0. Update costs.' });
        }

        let cumulativeValue = 0;
        const updates = [];

        for (const item of materialValues) {
            cumulativeValue += item.value;
            const percentage = (cumulativeValue / totalValue) * 100;

            let category: 'A' | 'B' | 'C' = 'C';
            if (percentage <= 70) category = 'A';
            else if (percentage <= 90) category = 'B';

            updates.push({
                updateOne: {
                    filter: { _id: item.id },
                    update: { $set: { abcCategory: category } }
                }
            });
        }

        await Material.bulkWrite(updates);
        res.json({ message: 'ABC Analysis completed', totalValue, count: materials.length });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
