import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';
import { markAttendance, bulkMarkAttendance, getAttendanceByDate, getWorkerAttendance, getAttendanceSummary } from '../controllers/attendanceController';

const router = Router();

router.use(protect);

// Mark single attendance
router.post('/', authorize('HR_MANAGER', 'MANAGER', 'ADMIN'), logAudit('MARK_ATTENDANCE'), markAttendance);

// Bulk mark
router.post('/bulk', authorize('HR_MANAGER', 'MANAGER', 'ADMIN'), logAudit('BULK_MARK_ATTENDANCE'), bulkMarkAttendance);

// Get by date
router.get('/date', authorize('HR_MANAGER', 'MANAGER', 'ADMIN'), getAttendanceByDate);

// Get worker's attendance history
router.get('/worker/:workerId', authorize('HR_MANAGER', 'MANAGER', 'ADMIN'), getWorkerAttendance);

// Get monthly summary
router.get('/summary', authorize('HR_MANAGER', 'MANAGER', 'ADMIN'), getAttendanceSummary);

export default router;
