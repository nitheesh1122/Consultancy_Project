import { Request, Response } from 'express';
import Settings from '../models/Settings';

interface AuthRequest extends Request {
    user?: {
        _id: string;
        role: string;
        [key: string]: any;
    }
}

// @desc    Get Settings (specifically utilities for calculations)
// @route   GET /api/settings
// @access  Private 
export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();

        // If no settings exist yet, create default
        if (!settings) {
            settings = await Settings.create({
                utilityRates: {
                    waterPerLiter: 0,
                    steamPerKg: 0,
                    electricityPerKwh: 0
                }
            });
        }

        res.json(settings);
    } catch (err: any) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
};

// @desc    Update Utility Rates
// @route   PUT /api/settings/utilities
// @access  Private (Store Manager or Admin)
export const updateUtilityRates = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { utilityRates } = req.body;

        if (!utilityRates || typeof utilityRates.waterPerLiter === 'undefined'
            || typeof utilityRates.steamPerKg === 'undefined'
            || typeof utilityRates.electricityPerKwh === 'undefined') {
            res.status(400).json({ message: 'Please provide all utility rates' });
            return;
        }

        // Ensure they are positive
        if (utilityRates.waterPerLiter < 0 || utilityRates.steamPerKg < 0 || utilityRates.electricityPerKwh < 0) {
            res.status(400).json({ message: 'Rates cannot be negative' });
            return;
        }

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        settings.utilityRates = utilityRates;
        if (req.user) {
            settings.updatedBy = req.user._id as any;
        }

        const updatedSettings = await settings.save();

        res.json(updatedSettings);
    } catch (err: any) {
        console.error('Error updating settings:', err);
        res.status(500).json({ message: 'Server error updating settings' });
    }
};
