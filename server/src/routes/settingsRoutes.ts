import express from 'express';
import { getSettings, updateUtilityRates } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Calculate costs based on settings is internal mostly but Admins/Managers can view rates directly
router.get('/', protect, authorize('STORE_MANAGER', 'ADMIN'), getSettings);
router.put('/utilities', protect, authorize('STORE_MANAGER', 'ADMIN'), updateUtilityRates);

export default router;
