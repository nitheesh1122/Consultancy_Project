import express from 'express';
import { createPI, getPIs, updatePIStatus, processInward } from '../controllers/piController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Store Manager: Raise PI
router.post('/', protect, authorize('STORE_MANAGER'), createPI);

// Manager/Admin: View PIs
router.get('/', protect, authorize('STORE_MANAGER', 'ADMIN'), getPIs);

// Admin: Approve/Reject
router.put('/:id/status', protect, authorize('ADMIN'), updatePIStatus);

// Store Manager: Process Inward (Stock Update)
router.post('/:id/inward', protect, authorize('STORE_MANAGER'), processInward);

export default router;
