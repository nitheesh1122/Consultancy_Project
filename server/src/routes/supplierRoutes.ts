import express from 'express';
import { getSuppliers, getSupplierAnalytics, createSupplier } from '../controllers/suppliersController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER'), getSuppliers);
router.post('/', protect, authorize('ADMIN', 'MANAGER'), createSupplier);
router.get('/:id/analytics', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER'), getSupplierAnalytics);

export default router;
