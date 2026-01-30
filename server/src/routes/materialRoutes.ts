import express from 'express';
import { getMaterials } from '../controllers/materialController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getMaterials);

export default router;
