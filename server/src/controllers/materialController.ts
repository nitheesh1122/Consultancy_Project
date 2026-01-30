import { Request, Response } from 'express';
import { Material } from '../models/Material';

export const getMaterials = async (req: Request, res: Response) => {
    try {
        const materials = await Material.find({}).sort({ name: 1 });
        res.json(materials);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
