import { Request, Response } from 'express';
import ProductionBatch from '../models/ProductionBatch';
import Machine from '../models/Machine';
import Worker from '../models/Worker';
import Settings from '../models/Settings';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
    user?: { _id: string; role: string;[key: string]: any; }
}

// Helper to generate next batch number (e.g. BATCH-202603-001)
const generateBatchNumber = async (): Promise<string> => {
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
    const prefix = `BATCH-${dateStr}-`;

    const lastBatch = await ProductionBatch.findOne({ batchNumber: new RegExp(`^${prefix}`) })
        .sort({ batchNumber: -1 });

    if (!lastBatch) return `${prefix}001`;

    const lastSequence = parseInt(lastBatch.batchNumber.replace(prefix, ''), 10);
    const nextSequence = (lastSequence + 1).toString().padStart(3, '0');

    return `${prefix}${nextSequence}`;
};

// @desc    Create a new production schedule
// @route   POST /api/production-batches
// @access  Private (Supervisor)
export const createBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { machineId, scheduledDate, shift, lotNumber, fabricType, gsm, inputKg, rolls, supplierParty, shadeTarget } = req.body;

        if (!machineId || !scheduledDate || !shift || !lotNumber || !fabricType || !inputKg || !supplierParty || !shadeTarget) {
            res.status(400).json({ message: 'Missing required scheduling fields' });
            return;
        }

        if (inputKg < 0) {
            res.status(400).json({ message: 'Input Kg cannot be negative' });
            return;
        }

        // Verify machine exists and is active
        const machine = await Machine.findById(machineId);
        if (!machine || machine.status !== 'ACTIVE') {
            res.status(400).json({ message: 'Machine is not available or retired' });
            return;
        }

        const batchNumber = await generateBatchNumber();

        const newBatch = new ProductionBatch({
            batchNumber,
            supervisorId: req.user?._id,
            machineId,
            scheduledDate,
            shift,
            lotNumber,
            fabricType,
            gsm,
            inputKg,
            rolls,
            supplierParty,
            shadeTarget,
            status: 'SCHEDULED'
        });

        const savedBatch = await newBatch.save();
        res.status(201).json(savedBatch);
    } catch (err: any) {
        console.error('Error creating batch:', err);
        res.status(500).json({ message: 'Server error creating batch' });
    }
};

// @desc    Start a scheduled batch
// @route   PUT /api/production-batches/:id/start
// @access  Private (Supervisor)
export const startBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { assignedWorkers } = req.body; // Array of Worker IDs

        if (!assignedWorkers || !Array.isArray(assignedWorkers) || assignedWorkers.length === 0) {
            res.status(400).json({ message: 'At least one worker must be assigned' });
            return;
        }

        const batch = await ProductionBatch.findById(req.params.id);
        if (!batch) {
            res.status(404).json({ message: 'Batch not found' });
            return;
        }

        if (batch.status !== 'SCHEDULED') {
            res.status(400).json({ message: `Cannot start batch in ${batch.status} state` });
            return;
        }

        // Validate machine is still active and not currently running another batch
        const machine = await Machine.findById(batch.machineId);
        if (!machine || machine.status !== 'ACTIVE') {
            res.status(400).json({ message: 'Assigned machine is unavailable' }); return;
        }

        const runningMachineBatch = await ProductionBatch.findOne({ machineId: batch.machineId, status: 'IN_PROGRESS' });
        if (runningMachineBatch) {
            res.status(400).json({ message: 'Machine is currently running another batch' }); return;
        }

        // Validate workers are active and not currently busy
        const objectIdWorkers = assignedWorkers.map(id => new mongoose.Types.ObjectId(id));
        const activeWorkersCount = await Worker.countDocuments({ _id: { $in: objectIdWorkers }, status: 'ACTIVE' });
        if (activeWorkersCount !== assignedWorkers.length) {
            res.status(400).json({ message: 'One or more workers are inactive or do not exist' }); return;
        }

        const busyWorkers = await ProductionBatch.findOne({
            status: 'IN_PROGRESS',
            assignedWorkers: { $in: objectIdWorkers }
        });

        if (busyWorkers) {
            res.status(400).json({ message: 'One or more workers are already assigned to an active batch' }); return;
        }

        batch.status = 'IN_PROGRESS';
        batch.startTime = new Date();
        batch.assignedWorkers = objectIdWorkers;

        const startedBatch = await batch.save();
        res.json(startedBatch);

    } catch (err: any) {
        console.error('Error starting batch:', err);
        res.status(500).json({ message: 'Server error starting batch' });
    }
};

// @desc    Complete a batch and calculate yield
// @route   PUT /api/production-batches/:id/complete
// @access  Private (Supervisor)
export const completeBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            outputFirstGradeKg,
            outputSecondGradeKg = 0,
            rejectionKg = 0,
            quality,
            wastage,
            utilities
        } = req.body;

        if (typeof outputFirstGradeKg !== 'number' || outputFirstGradeKg < 0) {
            res.status(400).json({ message: 'Valid First Grade Output Kg is required' }); return;
        }

        const batch = await ProductionBatch.findById(req.params.id);
        if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

        if (batch.status !== 'IN_PROGRESS') {
            res.status(400).json({ message: 'Only IN_PROGRESS batches can be completed' }); return;
        }

        // Validation: output shouldn't wildly exceed input (allow 10% pickup for moisture weight)
        const totalOutput = outputFirstGradeKg + outputSecondGradeKg + rejectionKg;
        const maxAllowed = batch.inputKg * 1.1; // 110%
        if (totalOutput > maxAllowed) {
            res.status(400).json({ message: `Total output (${totalOutput}kg) exceeds allowed variance for input (${batch.inputKg}kg)` }); return;
        }

        // Calculate Yield and Wastage
        const yieldPercentage = ((outputFirstGradeKg + outputSecondGradeKg) / batch.inputKg) * 100;
        const wastagePercentage = (rejectionKg / batch.inputKg) * 100;

        // Calculate Costs based on latest Settings
        let calculatedUtilityCost = 0;
        try {
            const settings = await Settings.findOne();
            if (settings && utilities) {
                calculatedUtilityCost =
                    ((utilities.waterLiters || 0) * settings.utilityRates.waterPerLiter) +
                    ((utilities.steamKg || 0) * settings.utilityRates.steamPerKg) +
                    ((utilities.electricityKwh || 0) * settings.utilityRates.electricityPerKwh);
            }
        } catch (e) { console.error('Failed calculating utility cost', e); }

        batch.outputFirstGradeKg = outputFirstGradeKg;
        batch.outputSecondGradeKg = outputSecondGradeKg;
        batch.rejectionKg = rejectionKg;
        batch.quality = quality;
        batch.wastage = wastage;
        batch.utilities = utilities;
        batch.yieldPercentage = Number(yieldPercentage.toFixed(2));
        batch.wastagePercentage = Number(wastagePercentage.toFixed(2));

        // Cost snapshot (Material cost would be fetched from transaction ledger optionally, setting to 0 for now as placeholder or could be updated asynchronously)
        batch.calculatedCosts = {
            materialCost: 0,
            utilityCost: Number(calculatedUtilityCost.toFixed(2)),
            totalCostPerKg: 0 // Will require combining MRS cost + Utility cost divided by output
        };

        batch.endTime = new Date();
        batch.status = 'COMPLETED';

        const completedBatch = await batch.save();
        res.json(completedBatch);

    } catch (err: any) {
        console.error('Error completing batch:', err);
        res.status(500).json({ message: 'Server error completing batch' });
    }
};

// @desc    Get all batches / history (Filterable by status)
// @route   GET /api/production-batches
// @access  Private (All Roles)
export const getBatches = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const statusFilter = req.query.status ? { status: req.query.status } : {};
        const batches = await ProductionBatch.find(statusFilter)
            .populate('machineId', 'name type machineId')
            .populate('supervisorId', 'username')
            .populate('assignedWorkers', 'name workerId role')
            .sort({ createdAt: -1 });

        res.json(batches);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Monitor View Dashboard
// @route   GET /api/production-batches/monitor
// @access  Private (Manager, Admin)
export const getMonitorView = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const activeBatches = await ProductionBatch.find({ status: 'IN_PROGRESS' })
            .populate('machineId', 'name machineId location')
            .populate('supervisorId', 'username')
            .populate('assignedWorkers', 'name role');

        // Also fetch machines grouped by status for top-level view
        const machines = await Machine.find({}, 'name machineId status type capacityKg');

        const machineStats = {
            total: machines.length,
            active: machines.filter(m => m.status === 'ACTIVE').length,
            maintenance: machines.filter(m => m.status === 'MAINTENANCE').length
        };

        const currentlyRunning = activeBatches.length;

        res.json({
            machines,
            machineStats,
            currentlyRunning,
            activeBatches
        });
    } catch (e) {
        res.status(500).json({ message: 'Server error loading monitor view' });
    }
};
