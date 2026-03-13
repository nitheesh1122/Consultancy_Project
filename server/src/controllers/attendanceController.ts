import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import Worker from '../models/Worker';
import { manualLog } from '../middleware/auditMiddleware';
import { getIO } from '../socket';

interface AuthRequest extends Request {
    user?: any;
}

// Mark attendance for a worker
export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { workerId, date, shift, status, clockIn, clockOut, overtimeHours, remarks } = req.body;

        if (!workerId || !date || !shift) {
            return res.status(400).json({ message: 'workerId, date, and shift are required' });
        }

        const worker = await Worker.findById(workerId);
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        // Upsert attendance record
        const attendance = await Attendance.findOneAndUpdate(
            { workerId, date: new Date(date) },
            {
                workerId,
                date: new Date(date),
                shift,
                status: status || 'PRESENT',
                clockIn: clockIn ? new Date(clockIn) : undefined,
                clockOut: clockOut ? new Date(clockOut) : undefined,
                overtimeHours: overtimeHours || 0,
                remarks,
                markedBy: req.user.id,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Update worker status for leave
        if (status === 'ON_LEAVE') {
            worker.status = 'ON_LEAVE';
            await worker.save();
        }

        await manualLog('ATTENDANCE_MARKED', req.user.id, { workerId, date, shift, status: status || 'PRESENT' });
        getIO().to('HR_MANAGER').emit('attendance:marked', { workerId, date });

        res.json(attendance);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Attendance already recorded for this worker on this date' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Bulk mark attendance
export const bulkMarkAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { records } = req.body; // [{workerId, date, shift, status}]
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ message: 'records array is required' });
        }

        const results = [];
        for (const record of records) {
            const attendance = await Attendance.findOneAndUpdate(
                { workerId: record.workerId, date: new Date(record.date) },
                {
                    ...record,
                    date: new Date(record.date),
                    markedBy: req.user.id
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            results.push(attendance);
        }

        await manualLog('BULK_ATTENDANCE_MARKED', req.user.id, { count: records.length });
        getIO().to('HR_MANAGER').emit('attendance:bulk_marked', { count: records.length });

        res.json({ marked: results.length, records: results });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance for a specific date
export const getAttendanceByDate = async (req: AuthRequest, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'date query parameter is required' });

        const targetDate = new Date(date as string);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const records = await Attendance.find({
            date: { $gte: targetDate, $lt: nextDay }
        }).populate('workerId', 'name workerId role status').populate('markedBy', 'username').sort({ 'workerId.name': 1 });

        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance history for a worker
export const getWorkerAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const filter: any = { workerId: req.params.workerId };
        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
        }
        const records = await Attendance.find(filter).sort({ date: -1 }).limit(90);
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get attendance summary/stats
export const getAttendanceSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month as string) || new Date().getMonth() + 1;
        const y = parseInt(year as string) || new Date().getFullYear();

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const records = await Attendance.find({
            date: { $gte: startDate, $lte: endDate }
        }).populate('workerId', 'name workerId role');

        // Aggregate by worker
        const workerMap = new Map<string, { name: string; workerId: string; present: number; absent: number; late: number; halfDay: number; onLeave: number; overtime: number }>();
        for (const r of records) {
            const w = r.workerId as any;
            if (!w) continue;
            const key = w._id.toString();
            if (!workerMap.has(key)) {
                workerMap.set(key, { name: w.name, workerId: w.workerId, present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, overtime: 0 });
            }
            const entry = workerMap.get(key)!;
            if (r.status === 'PRESENT') entry.present++;
            else if (r.status === 'ABSENT') entry.absent++;
            else if (r.status === 'LATE') entry.late++;
            else if (r.status === 'HALF_DAY') entry.halfDay++;
            else if (r.status === 'ON_LEAVE') entry.onLeave++;
            entry.overtime += r.overtimeHours || 0;
        }

        res.json({
            month: m,
            year: y,
            totalRecords: records.length,
            workers: Array.from(workerMap.values())
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
