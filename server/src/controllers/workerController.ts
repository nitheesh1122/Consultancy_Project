import { Request, Response } from 'express';
import Worker from '../models/Worker';
import ProductionBatch from '../models/ProductionBatch';

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private (Store Manager, Admin, Supervisor)
export const getWorkers = async (req: Request, res: Response) => {
    try {
        const workers = await Worker.find().sort({ createdAt: -1 });
        res.json(workers);
    } catch (err: any) {
        console.error('Error fetching workers:', err);
        res.status(500).json({ message: 'Server error fetching workers' });
    }
};

// @desc    Create new worker
// @route   POST /api/workers
// @access  Private (Store Manager)
export const createWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        const { workerId, name, role, skills, phone, joiningDate } = req.body;

        if (!workerId || !name || !role) {
            res.status(400).json({ message: 'Please provide required fields (workerId, name, role)' });
            return;
        }

        // Check if workerId exists
        const workerExists = await Worker.findOne({ workerId });
        if (workerExists) {
            res.status(400).json({ message: 'Worker ID already exists' });
            return;
        }

        const newWorker = new Worker({
            workerId,
            name,
            role,
            skills: skills || [],
            phone,
            joiningDate: joiningDate || new Date(),
            status: 'ACTIVE'
        });

        const savedWorker = await newWorker.save();
        res.status(201).json(savedWorker);
    } catch (err: any) {
        console.error('Error creating worker:', err);
        res.status(500).json({ message: 'Server error creating worker' });
    }
};

// @desc    Update worker
// @route   PUT /api/workers/:id
// @access  Private (Store Manager)
export const updateWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, role, skills, phone, status } = req.body;

        const worker = await Worker.findById(req.params.id);

        if (!worker) {
            res.status(404).json({ message: 'Worker not found' });
            return;
        }

        if (name) worker.name = name;
        if (role) worker.role = role;
        if (skills) worker.skills = skills;
        if (phone) worker.phone = phone;
        if (status) worker.status = status;

        const updatedWorker = await worker.save();
        res.json(updatedWorker);
    } catch (err: any) {
        console.error('Error updating worker:', err);
        res.status(500).json({ message: 'Server error updating worker' });
    }
};

// @desc    Soft Delete / Retire Worker
// @route   DELETE /api/workers/:id
// @access  Private (Store Manager)
export const deleteWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        const worker = await Worker.findById(req.params.id);

        if (!worker) {
            res.status(404).json({ message: 'Worker not found' });
            return;
        }

        worker.status = 'INACTIVE';
        await worker.save();

        res.json({ message: 'Worker set to INACTIVE successfully' });
    } catch (err: any) {
        console.error('Error deactivating worker:', err);
        res.status(500).json({ message: 'Server error deactivating worker' });
    }
};

// @desc    Get available workers (not in an IN_PROGRESS batch)
// @route   GET /api/workers/available
// @access  Private (Store Manager, Admin, Supervisor)
export const getAvailableWorkers = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Find all active batches to get currently busy workers
        const activeBatches = await ProductionBatch.find({ status: 'IN_PROGRESS' }, 'assignedWorkers');

        // Flatten all assigned workers from active batches
        const busyWorkerIds = activeBatches.reduce((acc: any[], batch) => {
            if (batch.assignedWorkers && Array.isArray(batch.assignedWorkers)) {
                acc.push(...batch.assignedWorkers);
            }
            return acc;
        }, []);

        // 2. Find workers who are ACTIVE and NOT in the busy list
        const availableWorkers = await Worker.find({
            status: 'ACTIVE',
            _id: { $nin: busyWorkerIds }
        }).sort({ name: 1 });

        res.json(availableWorkers);
    } catch (err: any) {
        console.error('Error fetching available workers:', err);
        res.status(500).json({ message: 'Server error fetching available workers' });
    }
};
