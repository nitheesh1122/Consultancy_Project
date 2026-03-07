import express from 'express';
import {
    getRecipients,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    getConfig,
    updateConfig,
    generateReport,
    sendReport
} from '../controllers/reportController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Apply ADMIN protection to all routes in this module
router.use(protect);
router.use(authorize('ADMIN'));

// Recipients
router.get('/recipients', getRecipients);
router.post('/recipients', addRecipient);
router.put('/recipients/:id', updateRecipient);
router.delete('/recipients/:id', deleteRecipient);

// Settings
router.get('/config', getConfig);
router.put('/config', updateConfig);

// Reports
router.get('/generate', generateReport);
router.post('/send', sendReport);

export default router;
