import express from 'express';
import { getAuditLogs, exportAuditLogsCSV } from '../controllers/auditController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, authorize('ADMIN'), getAuditLogs);
router.get('/export/csv', protect, authorize('ADMIN'), exportAuditLogsCSV);

export default router;
