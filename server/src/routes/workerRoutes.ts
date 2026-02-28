import express from 'express';
import { getWorkers, createWorker, updateWorker, deleteWorker, getAvailableWorkers } from '../controllers/workerController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// GET all workers is accessible to Supervisors for assignment
router.get('/', protect, getWorkers);

// GET available workers
router.get('/available', protect, getAvailableWorkers);

// Modifying workers is restricted
router.post('/', protect, authorize('STORE_MANAGER', 'ADMIN'), createWorker);
router.put('/:id', protect, authorize('STORE_MANAGER', 'ADMIN'), updateWorker);
router.delete('/:id', protect, authorize('STORE_MANAGER', 'ADMIN'), deleteWorker);

export default router;
