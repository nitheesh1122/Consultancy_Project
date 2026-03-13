import { Request, Response } from 'express';
import { LeaveRequest } from '../models/LeaveRequest';
import Worker from '../models/Worker';
import { Notification } from '../models/Notification';
import { getIO } from '../socket';
import { manualLog } from '../middleware/auditMiddleware';

interface AuthRequest extends Request {
    user?: any;
}

// Create leave request
export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { workerId, leaveType, startDate, endDate, reason } = req.body;

        if (!workerId || !leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'workerId, leaveType, startDate, endDate, and reason are required' });
        }

        const worker = await Worker.findById(workerId);
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const leave = await LeaveRequest.create({
            workerId,
            leaveType,
            startDate: start,
            endDate: end,
            days,
            reason
        });

        // Notify HR Manager
        await Notification.create({
            recipient: req.user.id,
            type: 'INFO',
            message: `Leave request for ${worker.name}: ${leaveType} (${days} days)`,
            link: `/hr/leave-requests`
        });
        getIO().to('HR_MANAGER').emit('leave:requested', { leaveId: leave._id, workerName: worker.name });

        await manualLog('LEAVE_REQUEST_CREATED', req.user.id, { workerId, leaveType, days });

        res.status(201).json(leave);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get all leave requests
export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { status, workerId } = req.query;
        const filter: any = {};
        if (status) filter.status = status;
        if (workerId) filter.workerId = workerId;

        const leaves = await LeaveRequest.find(filter)
            .populate('workerId', 'name workerId role')
            .populate('approvedBy', 'username')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Approve/reject leave
export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status, rejectionReason } = req.body;
        const leave = await LeaveRequest.findById(req.params.id).populate('workerId');
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        if (leave.status !== 'PENDING') {
            return res.status(400).json({ message: 'Can only update pending leave requests' });
        }

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
        }

        leave.status = status;
        leave.approvedBy = req.user.id;
        leave.approvedAt = new Date();
        if (status === 'REJECTED') {
            leave.rejectionReason = rejectionReason || '';
        }

        await leave.save();

        // If approved, update worker status
        if (status === 'APPROVED') {
            const today = new Date();
            if (leave.startDate <= today && leave.endDate >= today) {
                await Worker.findByIdAndUpdate(leave.workerId, { status: 'ON_LEAVE' });
            }
        }

        const worker = leave.workerId as any;
        getIO().to('HR_MANAGER').emit('leave:updated', { leaveId: leave._id, status });
        await manualLog('LEAVE_STATUS_UPDATED', req.user.id, { leaveId: leave._id, status, workerName: worker?.name });

        res.json(leave);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get leave summary for dashboard
export const getLeaveSummary = async (req: AuthRequest, res: Response) => {
    try {
        const pending = await LeaveRequest.countDocuments({ status: 'PENDING' });
        const approved = await LeaveRequest.countDocuments({ status: 'APPROVED' });
        const rejected = await LeaveRequest.countDocuments({ status: 'REJECTED' });

        // Workers currently on leave
        const today = new Date();
        const onLeave = await LeaveRequest.find({
            status: 'APPROVED',
            startDate: { $lte: today },
            endDate: { $gte: today }
        }).populate('workerId', 'name workerId role');

        res.json({ pending, approved, rejected, currentlyOnLeave: onLeave });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
