import express from 'express';
import {
    getDashboardStats,
    getInventoryHealth,
    getProcurementPerformance,
    getEfficiencyStats,
    getCostAnalytics,
    getForecast,
    getWorkerPerformance,
    getWorkerEfficiency,
    getSupplierQuality,
    getHRDashboardStats,
    getManagerDashboard,
    getStoreManagerDashboard,
    getAdminDashboard
} from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// General Dashboard (Summary)
router.get('/dashboard', protect, getDashboardStats);

// Role-Specific Dashboards
router.get('/dashboard/manager', protect, authorize('MANAGER'), getManagerDashboard);
router.get('/dashboard/store-manager', protect, authorize('STORE_MANAGER'), getStoreManagerDashboard);
router.get('/dashboard/admin', protect, authorize('ADMIN'), getAdminDashboard);

// Detailed Analytics Modules
router.get('/inventory-health', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER'), getInventoryHealth);
router.get('/procurement-performance', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER'), getProcurementPerformance);
router.get('/efficiency', protect, authorize('ADMIN', 'MANAGER', 'SUPERVISOR'), getEfficiencyStats); // Supervisor allowed for efficiency but maybe restricted scope? Prompt says Supervisor sees MRS analytics.
router.get('/cost', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER'), getCostAnalytics);
router.get('/forecast', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER'), getForecast);

// Phase 1.5 endpoints
router.get('/workers/performance', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER', 'HR_MANAGER'), getWorkerPerformance);
router.get('/workers/efficiency', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER', 'HR_MANAGER'), getWorkerEfficiency);
router.get('/suppliers/quality', protect, authorize('ADMIN', 'MANAGER', 'STORE_MANAGER'), getSupplierQuality);

// HR Dashboard
router.get('/hr-dashboard', protect, authorize('ADMIN', 'MANAGER', 'HR_MANAGER'), getHRDashboardStats);

export default router;
