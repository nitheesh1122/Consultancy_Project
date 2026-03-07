import express from 'express';
import { createMRS, getMyMRS, getPendingMRS, getMRSHistory, issueMRS, returnMaterial } from '../controllers/mrsController';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';

const router = express.Router();

router.post('/', protect, authorize('SUPERVISOR'), logAudit('MRS_CREATED'), createMRS);
router.get('/my', protect, authorize('SUPERVISOR'), getMyMRS);

// Store Manager Routes
router.get('/pending', protect, authorize('STORE_MANAGER', 'ADMIN'), getPendingMRS);
router.get('/history', protect, authorize('STORE_MANAGER', 'ADMIN'), getMRSHistory);
router.put('/:id/issue', protect, authorize('STORE_MANAGER', 'ADMIN'), logAudit('MRS_ISSUED'), issueMRS);
router.post('/return', protect, authorize('SUPERVISOR'), logAudit('MATERIAL_RETURNED'), returnMaterial);

export default router;
