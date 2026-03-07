import express from 'express';
import { createPI, getPIs, updatePIStatus, processInward } from '../controllers/piController';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';

const router = express.Router();

// Store Manager: Raise PI
router.post('/', protect, authorize('STORE_MANAGER'), logAudit('PI_RAISED'), createPI);

// Manager/Admin: View PIs
router.get('/', protect, authorize('STORE_MANAGER', 'ADMIN'), getPIs);

// Admin: Approve/Reject
router.put('/:id/status', protect, authorize('ADMIN'), logAudit('PI_STATUS_UPDATED'), updatePIStatus);

// Store Manager: Process Inward (Stock Update)
router.post('/:id/inward', protect, authorize('STORE_MANAGER'), logAudit('INWARD_PROCESSED'), processInward);

export default router;
