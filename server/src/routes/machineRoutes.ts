import express from 'express';
import { getMachines, createMachine, updateMachine, deleteMachine } from '../controllers/machineController';
import { protect, authorize, requireManager } from '../middleware/authMiddleware';

const router = express.Router();

// GET all machines is accessible to any logged-in user (Supervisors need it for assigning batches)
router.get('/', protect, getMachines);

// Only MANAGER can modify machines (ADMIN is restricted to read-only)
router.post('/', protect, authorize('MANAGER'), requireManager, createMachine);
router.put('/:id', protect, authorize('MANAGER'), requireManager, updateMachine);
router.delete('/:id', protect, authorize('MANAGER'), requireManager, deleteMachine);

export default router;
