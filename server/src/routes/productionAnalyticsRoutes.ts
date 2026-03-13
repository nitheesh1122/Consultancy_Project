import express from 'express';
import { getProductionDashboard } from '../controllers/productionAnalyticsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/dashboard', protect, authorize('ADMIN', 'MANAGER'), getProductionDashboard);

export default router;
