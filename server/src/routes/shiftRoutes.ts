import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';
import { createShift, getShifts, assignWorkers, deleteShift } from '../controllers/shiftController';

const router = Router();

router.use(protect);

// Create/update shift
router.post('/', authorize('HR_MANAGER', 'MANAGER', 'SUPERVISOR'), logAudit('CREATE_SHIFT'), createShift);

// Get shifts (query: ?date=YYYY-MM-DD or ?startDate=...&endDate=...)
router.get('/', authorize('HR_MANAGER', 'MANAGER', 'SUPERVISOR', 'ADMIN'), getShifts);

// Assign workers to shift
router.put('/:id/assign', authorize('HR_MANAGER', 'MANAGER', 'SUPERVISOR'), logAudit('ASSIGN_WORKERS'), assignWorkers);

// Delete shift
router.delete('/:id', authorize('HR_MANAGER', 'MANAGER'), logAudit('DELETE_SHIFT'), deleteShift);

export default router;
