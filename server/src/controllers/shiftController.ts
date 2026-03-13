import { Request, Response } from 'express';
import { Shift } from '../models/Shift';
import Worker from '../models/Worker';
import { manualLog } from '../middleware/auditMiddleware';
import { getIO } from '../socket';

interface AuthRequest extends Request {
    user?: any;
}

// Create or update a shift
export const createShift = async (req: AuthRequest, res: Response) => {
    try {
        const { name, startTime, endTime, date, workers, capacity, supervisor, remarks } = req.body;

        if (!name || !startTime || !endTime || !date) {
            return res.status(400).json({ message: 'name, startTime, endTime, and date are required' });
        }

        const shift = await Shift.findOneAndUpdate(
            { name, date: new Date(date) },
            {
                name,
                startTime,
                endTime,
                date: new Date(date),
                workers: workers || [],
                capacity: capacity || 20,
                supervisor,
                remarks,
                createdBy: req.user.id
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await manualLog('SHIFT_CREATED', req.user.id, { shiftName: name, date, workerCount: workers?.length || 0 });
        getIO().to('HR_MANAGER').emit('shift:created', { shiftId: shift._id });

        res.status(201).json(shift);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get shifts for a date range
export const getShifts = async (req: AuthRequest, res: Response) => {
    try {
        const { date, startDate, endDate } = req.query;
        const filter: any = {};

        if (date) {
            const d = new Date(date as string);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            filter.date = { $gte: d, $lt: next };
        } else if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
        }

        const shifts = await Shift.find(filter)
            .populate('workers', 'name workerId role status')
            .populate('supervisor', 'username')
            .populate('createdBy', 'username')
            .sort({ date: -1, name: 1 });

        res.json(shifts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Assign workers to shift
export const assignWorkers = async (req: AuthRequest, res: Response) => {
    try {
        const { workers } = req.body;
        const shift = await Shift.findById(req.params.id);
        if (!shift) return res.status(404).json({ message: 'Shift not found' });

        if (workers.length > shift.capacity) {
            return res.status(400).json({ message: `Cannot assign more than ${shift.capacity} workers` });
        }

        shift.workers = workers;
        await shift.save();

        await manualLog('SHIFT_WORKERS_ASSIGNED', req.user.id, { shiftId: shift._id, workerCount: workers.length });
        getIO().to('HR_MANAGER').emit('shift:updated', { shiftId: shift._id });

        const populated = await Shift.findById(shift._id)
            .populate('workers', 'name workerId role status')
            .populate('supervisor', 'username');

        res.json(populated);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete shift
export const deleteShift = async (req: AuthRequest, res: Response) => {
    try {
        const shift = await Shift.findByIdAndDelete(req.params.id);
        if (!shift) return res.status(404).json({ message: 'Shift not found' });

        await manualLog('SHIFT_DELETED', req.user.id, { shiftName: shift.name, date: shift.date });

        res.json({ message: 'Shift deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
