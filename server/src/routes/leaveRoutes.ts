import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';
import { createLeaveRequest, getLeaveRequests, updateLeaveStatus, getLeaveSummary } from '../controllers/leaveController';

const router = Router();

router.use(protect);

// Create leave request
router.post('/', authorize('HR_MANAGER', 'MANAGER', 'SUPERVISOR'), logAudit('CREATE_LEAVE'), createLeaveRequest);

// Get all leave requests (with optional filters: ?status=PENDING&workerId=xxx)
router.get('/', authorize('HR_MANAGER', 'MANAGER', 'ADMIN'), getLeaveRequests);

// Get summary for dashboard
router.get('/summary', authorize('HR_MANAGER', 'MANAGER', 'ADMIN'), getLeaveSummary);

// Approve/reject leave
router.put('/:id/status', authorize('HR_MANAGER', 'MANAGER'), logAudit('UPDATE_LEAVE_STATUS'), updateLeaveStatus);

export default router;
