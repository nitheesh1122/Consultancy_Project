import express from 'express';
import { createMRS, getMyMRS, getPendingMRS, issueMRS } from '../controllers/mrsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, authorize('SUPERVISOR'), createMRS);
router.get('/my', protect, authorize('SUPERVISOR'), getMyMRS);

// Store Manager Routes
router.get('/pending', protect, authorize('STORE_MANAGER', 'ADMIN'), getPendingMRS);
router.put('/:id/issue', protect, authorize('STORE_MANAGER', 'ADMIN'), issueMRS);

export default router;
