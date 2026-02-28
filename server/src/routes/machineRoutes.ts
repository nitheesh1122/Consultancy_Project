import express from 'express';
import { getMachines, createMachine, updateMachine, deleteMachine } from '../controllers/machineController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// GET all machines is accessible to any logged-in user (Supervisors need it for assigning batches)
router.get('/', protect, getMachines);

// Only STORE_MANAGER and ADMIN can modify machines
router.post('/', protect, authorize('STORE_MANAGER', 'ADMIN'), createMachine);
router.put('/:id', protect, authorize('STORE_MANAGER', 'ADMIN'), updateMachine);
router.delete('/:id', protect, authorize('STORE_MANAGER', 'ADMIN'), deleteMachine);

export default router;
