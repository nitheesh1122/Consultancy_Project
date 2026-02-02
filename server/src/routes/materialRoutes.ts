import express from 'express';
import { getMaterials, getProcurementContext, calculateABC } from '../controllers/materialController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getMaterials);
router.get('/abc', protect, authorize('STORE_MANAGER', 'ADMIN'), calculateABC);
router.get('/:id/procurement-context', protect, getProcurementContext);

export default router;
