import express from 'express';
import { getMaterialHistory } from '../controllers/transactionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:materialId', protect, getMaterialHistory);

export default router;
