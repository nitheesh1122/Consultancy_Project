import express from 'express';
import {
    createCustomer,
    getCustomers,
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    approveOrder,
    updateOrderStatus
} from '../controllers/customerOrderController';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';

const router = express.Router();

// ===== Customer management (ADMIN/MANAGER creates customers) =====
router.post('/customers', protect, authorize('ADMIN', 'MANAGER'), logAudit('CUSTOMER_CREATED'), createCustomer);
router.get('/customers', protect, authorize('ADMIN', 'MANAGER'), getCustomers);

// ===== Customer self-service (CUSTOMER role) =====
router.post('/orders', protect, authorize('CUSTOMER'), logAudit('ORDER_PLACED'), createOrder);
router.get('/orders', protect, authorize('CUSTOMER'), getMyOrders);
router.get('/orders/:id', protect, authorize('CUSTOMER', 'MANAGER', 'ADMIN'), getOrderById);

// ===== Manager order management =====
router.get('/all-orders', protect, authorize('MANAGER', 'ADMIN'), getAllOrders);
router.put('/orders/:id/approve', protect, authorize('MANAGER'), logAudit('ORDER_APPROVED'), approveOrder);
router.put('/orders/:id/status', protect, authorize('MANAGER'), logAudit('ORDER_STATUS_UPDATED'), updateOrderStatus);

export default router;
