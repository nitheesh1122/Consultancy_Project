import { Request, Response } from 'express';
import FabricLot from '../models/FabricLot';

interface AuthRequest extends Request {
    user?: any;
}

export const getLots = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const lots = await FabricLot.find(filter)
            .populate('supervisorId', 'name username')
            .sort({ createdAt: -1 });
        res.json(lots);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createLot = async (req: AuthRequest, res: Response) => {
    try {
        const newLot = new FabricLot({
            ...req.body,
            supervisorId: req.user.id
        });
        const savedLot = await newLot.save();
        res.status(201).json(savedLot);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateLot = async (req: AuthRequest, res: Response) => {
    try {
        const updatedLot = await FabricLot.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedLot) {
            return res.status(404).json({ message: 'Fabric lot not found' });
        }
        res.json(updatedLot);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteLot = async (req: AuthRequest, res: Response) => {
    try {
        const deletedLot = await FabricLot.findByIdAndDelete(req.params.id);
        if (!deletedLot) {
            return res.status(404).json({ message: 'Fabric lot not found' });
        }
        res.json({ message: 'Fabric lot removed successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
