import { Request, Response } from 'express';
import Machine from '../models/Machine';

// @desc    Get all machines
// @route   GET /api/machines
// @access  Private (Store Manager, Admin, Supervisor)
export const getMachines = async (req: Request, res: Response) => {
    try {
        const machines = await Machine.find().sort({ createdAt: -1 });
        res.json(machines);
    } catch (err: any) {
        console.error('Error fetching machines:', err);
        res.status(500).json({ message: 'Server error fetching machines' });
    }
};

// @desc    Create new machine
// @route   POST /api/machines
// @access  Private (Store Manager)
export const createMachine = async (req: Request, res: Response): Promise<void> => {
    try {
        const { machineId, name, type, capacityKg, specifications, operation, financial, infrastructure, status } = req.body;

        if (!machineId || !name || !type || !capacityKg) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }

        // Check if machineId exists
        const machineExists = await Machine.findOne({ machineId });
        if (machineExists) {
            res.status(400).json({ message: 'Machine ID already exists' });
            return;
        }

        const newMachine = new Machine({
            machineId,
            name,
            type,
            capacityKg,
            specifications,
            operation,
            financial,
            infrastructure,
            status: status || 'ACTIVE'
        });

        const savedMachine = await newMachine.save();
        res.status(201).json(savedMachine);
    } catch (err: any) {
        console.error('Error creating machine:', err);
        res.status(500).json({ message: 'Server error creating machine' });
    }
};

// @desc    Update machine
// @route   PUT /api/machines/:id
// @access  Private (Store Manager)
export const updateMachine = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, type, capacityKg, specifications, operation, financial, infrastructure, status, lastMaintenanceDate, nextMaintenanceDue } = req.body;

        const machine = await Machine.findById(req.params.id);

        if (!machine) {
            res.status(404).json({ message: 'Machine not found' });
            return;
        }

        if (name) machine.name = name;
        if (type) machine.type = type;
        if (capacityKg) machine.capacityKg = capacityKg;
        if (specifications) machine.specifications = specifications;
        if (operation) machine.operation = operation;
        if (financial) machine.financial = financial;
        if (infrastructure) machine.infrastructure = infrastructure;
        if (status) machine.status = status;
        if (lastMaintenanceDate) machine.lastMaintenanceDate = lastMaintenanceDate;
        if (nextMaintenanceDue) machine.nextMaintenanceDue = nextMaintenanceDue;

        const updatedMachine = await machine.save();
        res.json(updatedMachine);
    } catch (err: any) {
        console.error('Error updating machine:', err);
        res.status(500).json({ message: 'Server error updating machine' });
    }
};

// @desc    Soft Delete / Retire Machine
// @route   DELETE /api/machines/:id
// @access  Private (Store Manager)
export const deleteMachine = async (req: Request, res: Response): Promise<void> => {
    try {
        const machine = await Machine.findById(req.params.id);

        if (!machine) {
            res.status(404).json({ message: 'Machine not found' });
            return;
        }

        machine.status = 'RETIRED';
        await machine.save();

        res.json({ message: 'Machine retired successfully' });
    } catch (err: any) {
        console.error('Error deleting/retiring machine:', err);
        res.status(500).json({ message: 'Server error retiring machine' });
    }
};
