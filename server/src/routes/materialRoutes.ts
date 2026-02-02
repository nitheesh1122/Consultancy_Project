import express from 'express';
import { getMaterials, getProcurementContext } from '../controllers/materialController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getMaterials);
router.get('/:id/procurement-context', protect, getProcurementContext);

export default router;
