import express from 'express';
import { createBatch, startBatch, completeBatch, getBatches, getMonitorView, getBatchById } from '../controllers/productionBatchController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// General fetch accessible to everyone
router.get('/', protect, getBatches);

// Monitor strictly for Managers and Admins
router.get('/monitor', protect, authorize('STORE_MANAGER', 'ADMIN'), getMonitorView);

// Core workflow limited to Supervisors
router.post('/', protect, authorize('SUPERVISOR'), createBatch);
router.get('/:id', protect, getBatchById);
router.put('/:id/start', protect, authorize('SUPERVISOR'), startBatch);
router.put('/:id/complete', protect, authorize('SUPERVISOR'), completeBatch);

export default router;
