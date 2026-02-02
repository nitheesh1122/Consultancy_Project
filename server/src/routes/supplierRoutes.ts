import express from 'express';
import { getSuppliers, getSupplierAnalytics } from '../controllers/suppliersController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('ADMIN', 'STORE_MANAGER'), getSuppliers);
router.get('/:id/analytics', protect, authorize('ADMIN', 'STORE_MANAGER'), getSupplierAnalytics);

export default router;
