import { Request, Response } from 'express';
import ProductionBatch from '../models/ProductionBatch';
import Machine from '../models/Machine';
import Worker from '../models/Worker';
import Settings from '../models/Settings';
import { MRS } from '../models/MRS';
import { Material } from '../models/Material';
import mongoose from 'mongoose';
import { getIO } from '../socket';

interface AuthRequest extends Request {
    user?: { id: string; role: string;[key: string]: any; }
}

// Helper to generate next batch number (e.g. GTD-260301-001)
const generateBatchNumber = async (): Promise<string> => {
    const today = new Date();
    const yy = today.getFullYear().toString().slice(-2);
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');

    const prefix = `GTD-${yy}${mm}${dd}-`;

    // Only search today's batches to reset sequence daily
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
            supervisorId: req.user?.id,
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

        // Validate workers are active and not currently busy using ATOMIC LOCKING
        // We attempt to find the workers in ACTIVE state and immediately set them to BUSY.
        // If the number of modified workers doesn't match the requested length, a race condition or mismatch occurred.
        const objectIdWorkers = assignedWorkers.map(id => new mongoose.Types.ObjectId(id));

        // This query atomically locks all available workers for this specific batch.
        // It requires the workers to currently be exactly 'ACTIVE'.
        const lockResult = await Worker.updateMany(
            { _id: { $in: objectIdWorkers }, status: 'ACTIVE' },
            { $set: { status: 'BUSY' } } // We'll revert this if batch save fails, or release on completion
        );

        if (lockResult.modifiedCount !== assignedWorkers.length) {
            // Rollback any partial locks we might have acquired because the full transaction failed
            if (lockResult.modifiedCount > 0) {
                await Worker.updateMany(
                    { _id: { $in: objectIdWorkers }, status: 'BUSY' }, // Only target ones we technically might have just flipped
                    { $set: { status: 'ACTIVE' } }
                );
            }
            res.status(400).json({ message: 'One or more workers are currently busy or do not exist (Race Condition Avoided)' });
            return;
        }

        // --- Workers are now atomically locked as BUSY for this operation ---

        batch.status = 'IN_PROGRESS';
        batch.startTime = new Date();
        batch.assignedWorkers = objectIdWorkers;

        let startedBatch;
        try {
            startedBatch = await batch.save();
        } catch (saveErr) {
            // Hard Rollback: Free the workers if the batch failed to save
            await Worker.updateMany(
                { _id: { $in: objectIdWorkers }, status: 'BUSY' },
                { $set: { status: 'ACTIVE' } }
            );
            throw saveErr; // bubble up
        }
        const populatedBatch = await startedBatch.populate(['machineId', 'supervisorId']);

        // Emit socket event for real-time Monitor View update
        try {
            getIO().emit('batchStatusUpdate', {
                batchId: populatedBatch._id,
                status: populatedBatch.status,
                machineId: (populatedBatch.machineId as any)?._id,
                machineName: (populatedBatch.machineId as any)?.name,
                supervisorName: (populatedBatch.supervisorId as any)?.username,
                startTime: populatedBatch.startTime,
                type: 'start'
            });
        } catch (e) {
            console.error('Socket emission failed:', e);
        }

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
        // Overall Yield = Total Physical Output / Input (includes rejection since it's recovered material)
        const yieldPercentage = ((outputFirstGradeKg + outputSecondGradeKg + rejectionKg) / batch.inputKg) * 100;

        // Quality Yield (Bonus Metric) = First + Second Grade / Input
        const qualityYieldPercentage = ((outputFirstGradeKg + outputSecondGradeKg) / batch.inputKg) * 100;

        // Wastage % (Unrecoverable Loss) = (Input - Total Physical Output) / Input
        const wastagePercentage = ((batch.inputKg - (outputFirstGradeKg + outputSecondGradeKg + rejectionKg)) / batch.inputKg) * 100;

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
        batch.qualityYieldPercentage = Number(qualityYieldPercentage.toFixed(2));
        batch.wastagePercentage = Number(wastagePercentage.toFixed(2));

        // Resolve material cost from issued MRS items linked to this batch.
        let materialCost = 0;
        try {
            let mrs: any = null;

            if (batch.mrsId) {
                mrs = await MRS.findById(batch.mrsId);
            }

            if (!mrs) {
                // Fallback by batch number when explicit mrsId is not attached yet.
                mrs = await MRS.findOne({ batchId: batch.batchNumber }).sort({ createdAt: -1 });
            }

            if (mrs?.items?.length) {
                const issuedItems = mrs.items.filter((item: any) => (item.quantityIssued || 0) > 0);
                const materialIds = issuedItems.map((item: any) => item.materialId);
                const materials = await Material.find({ _id: { $in: materialIds } }, 'unitCost');
                const materialCostMap = new Map(materials.map((m: any) => [m._id.toString(), Number(m.unitCost || 0)]));

                materialCost = issuedItems.reduce((sum: number, item: any) => {
                    const unitCost = materialCostMap.get(item.materialId.toString()) || 0;
                    return sum + (Number(item.quantityIssued || 0) * unitCost);
                }, 0);
            }
        } catch (costErr) {
            console.error('Failed calculating material cost', costErr);
        }

        const effectiveOutputKg = Math.max(outputFirstGradeKg + outputSecondGradeKg, 0);
        const totalCost = materialCost + calculatedUtilityCost;
        const totalCostPerKg = effectiveOutputKg > 0 ? totalCost / effectiveOutputKg : 0;

        batch.calculatedCosts = {
            materialCost: Number(materialCost.toFixed(2)),
            utilityCost: Number(calculatedUtilityCost.toFixed(2)),
            totalCostPerKg: Number(totalCostPerKg.toFixed(2))
        };

        batch.endTime = new Date();
        batch.status = 'COMPLETED';

        const completedBatch = await batch.save();

        // Transaction Success: Free up the workers atomically back to ACTIVE
        if (completedBatch.assignedWorkers && completedBatch.assignedWorkers.length > 0) {
            await Worker.updateMany(
                { _id: { $in: completedBatch.assignedWorkers }, status: 'BUSY' },
                { $set: { status: 'ACTIVE' } }
            );
        }

        const populatedBatch = await completedBatch.populate(['machineId']);

        // Emit socket event for real-time Monitor View update
        try {
            getIO().emit('batchStatusUpdate', {
                batchId: populatedBatch._id,
                status: populatedBatch.status,
                machineName: (populatedBatch.machineId as any)?.name,
                yieldPercentage: populatedBatch.yieldPercentage,
                type: 'complete'
            });
        } catch (e) {
            console.error('Socket emission failed:', e);
        }

        res.json(completedBatch);

    } catch (err: any) {
        console.error('Error completing batch:', err);
        res.status(500).json({ message: 'Server error completing batch' });
    }
};

// @desc    Get a single batch by ID (fully populated)
// @route   GET /api/production-batches/:id
// @access  Private (All Roles)
export const getBatchById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const batch = await ProductionBatch.findById(req.params.id)
            .populate('machineId', 'name type machineId capacityKg')
            .populate('supervisorId', 'username email')
            .populate('assignedWorkers', 'name workerId role phone skills'); // skills requested by frontend

        if (!batch) {
            res.status(404).json({ message: 'Batch not found' });
            return;
        }

        res.json(batch);
    } catch (e) {
        res.status(500).json({ message: 'Server error fetching batch details' });
    }
};

// @desc    Get all batches / history (Filterable by status and dates)
// @route   GET /api/production-batches
// @access  Private (All Roles)
export const getBatches = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter: any = {};
        if (req.query.status) filter.status = req.query.status;

        if (req.query.startDate && req.query.endDate) {
            filter.scheduledDate = {
                $gte: new Date(req.query.startDate as string),
                $lte: new Date(req.query.endDate as string)
            };
        } else if (req.query.startDate) {
            filter.scheduledDate = { $gte: new Date(req.query.startDate as string) };
        } else if (req.query.endDate) {
            filter.scheduledDate = { $lte: new Date(req.query.endDate as string) };
        }

        const batches = await ProductionBatch.find(filter)
            .populate('machineId', 'name type machineId')
            .populate('supervisorId', 'username')
            .populate('assignedWorkers', 'name workerId role')
            .sort({ createdAt: -1 });

        res.json(batches);
    } catch (e) {
        res.status(500).json({ message: 'Server error fetching batches' });
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
