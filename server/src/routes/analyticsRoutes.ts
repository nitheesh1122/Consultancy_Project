import express from 'express';
import { getDashboardStats, getConsumptionStats, getBatchStats } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/consumption', protect, authorize('ADMIN'), getConsumptionStats);
router.get('/batch-stats', protect, authorize('ADMIN'), getBatchStats);

export default router;
