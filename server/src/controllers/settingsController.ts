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
                },
                targetYieldPercentage: 90,
                dailyReportEmails: []
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
        const { utilityRates, targetYieldPercentage, dailyReportEmails } = req.body;

        const normalizedRates = utilityRates
            ? {
                waterPerLiter: Number(utilityRates.waterPerLiter),
                steamPerKg: Number(utilityRates.steamPerKg),
                // Backward-compatible alias: frontend previously used powerPerKwh
                electricityPerKwh: Number(
                    typeof utilityRates.electricityPerKwh !== 'undefined'
                        ? utilityRates.electricityPerKwh
                        : utilityRates.powerPerKwh
                )
            }
            : null;

        if (!normalizedRates
            || Number.isNaN(normalizedRates.waterPerLiter)
            || Number.isNaN(normalizedRates.steamPerKg)
            || Number.isNaN(normalizedRates.electricityPerKwh)) {
            res.status(400).json({ message: 'Please provide all utility rates' });
            return;
        }

        // Ensure they are positive
        if (normalizedRates.waterPerLiter < 0 || normalizedRates.steamPerKg < 0 || normalizedRates.electricityPerKwh < 0) {
            res.status(400).json({ message: 'Rates cannot be negative' });
            return;
        }

        if (typeof targetYieldPercentage !== 'undefined') {
            const numericTargetYield = Number(targetYieldPercentage);
            if (Number.isNaN(numericTargetYield) || numericTargetYield < 0 || numericTargetYield > 100) {
                res.status(400).json({ message: 'targetYieldPercentage must be between 0 and 100' });
                return;
            }
        }

        if (typeof dailyReportEmails !== 'undefined' && !Array.isArray(dailyReportEmails)) {
            res.status(400).json({ message: 'dailyReportEmails must be an array of email addresses' });
            return;
        }

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        settings.utilityRates = normalizedRates;
        if (typeof targetYieldPercentage !== 'undefined') {
            settings.targetYieldPercentage = Number(targetYieldPercentage);
        }
        if (Array.isArray(dailyReportEmails)) {
            settings.dailyReportEmails = dailyReportEmails
                .map((email) => String(email).trim().toLowerCase())
                .filter((email) => email.length > 0);
        }
        if (req.user) {
            settings.updatedBy = req.user.id as any;
        }

        const updatedSettings = await settings.save();

        res.json(updatedSettings);
    } catch (err: any) {
        console.error('Error updating settings:', err);
        res.status(500).json({ message: 'Server error updating settings' });
    }
};
