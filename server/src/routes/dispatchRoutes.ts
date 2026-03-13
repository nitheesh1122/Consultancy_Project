import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';
import { createDispatch, getAllDispatches, getDispatchByOrder, updateDispatchStatus } from '../controllers/dispatchController';

const router = Router();

router.use(protect);

// Create dispatch (STORE_MANAGER, MANAGER)
router.post('/', authorize('STORE_MANAGER', 'MANAGER'), logAudit('CREATE_DISPATCH'), createDispatch);

// Get all dispatches (STORE_MANAGER, MANAGER, ADMIN)
router.get('/', authorize('STORE_MANAGER', 'MANAGER', 'ADMIN'), getAllDispatches);

// Get dispatch by order ID
router.get('/order/:orderId', authorize('STORE_MANAGER', 'MANAGER', 'ADMIN'), getDispatchByOrder);

// Update dispatch status (STORE_MANAGER, MANAGER)
router.put('/:id/status', authorize('STORE_MANAGER', 'MANAGER'), logAudit('UPDATE_DISPATCH_STATUS'), updateDispatchStatus);

export default router;
