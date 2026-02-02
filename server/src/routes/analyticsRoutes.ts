import express from 'express';
import {
    getDashboardStats,
    getInventoryHealth,
    getProcurementPerformance,
    getEfficiencyStats,
    getCostAnalytics,
    getForecast
} from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// General Dashboard (Summary)
router.get('/dashboard', protect, getDashboardStats);

// Detailed Analytics Modules
router.get('/inventory-health', protect, authorize('ADMIN', 'STORE_MANAGER'), getInventoryHealth);
router.get('/procurement-performance', protect, authorize('ADMIN', 'STORE_MANAGER'), getProcurementPerformance);
router.get('/efficiency', protect, authorize('ADMIN', 'SUPERVISOR'), getEfficiencyStats); // Supervisor allowed for efficiency but maybe restricted scope? Prompt says Supervisor sees MRS analytics.
router.get('/cost', protect, authorize('ADMIN', 'STORE_MANAGER'), getCostAnalytics);
router.get('/forecast', protect, authorize('ADMIN', 'STORE_MANAGER'), getForecast);

export default router;
