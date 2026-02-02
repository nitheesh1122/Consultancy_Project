import express from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('ADMIN'), getAuditLogs);

export default router;
