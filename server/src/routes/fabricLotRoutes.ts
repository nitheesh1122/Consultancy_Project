import express from 'express';
import { getLots, createLot, updateLot, deleteLot } from '../controllers/fabricLotController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getLots)
    .post(protect, authorize('ADMIN', 'SUPERVISOR', 'STORE_MANAGER'), createLot);

router.route('/:id')
    .put(protect, authorize('ADMIN', 'SUPERVISOR', 'STORE_MANAGER'), updateLot)
    .delete(protect, authorize('ADMIN', 'SUPERVISOR', 'STORE_MANAGER'), deleteLot);

export default router;
