import express from 'express';
import {
    createSupplierAccount,
    createRFQ,
    getRFQs,
    getSupplierRFQs,
    submitQuotation,
    getQuotationsForRFQ,
    acceptQuotation,
    getSupplierPOs,
    getAllPOs,
    confirmPO,
    createShipment,
    getSupplierShipments
} from '../controllers/supplierPortalController';
import { protect, authorize } from '../middleware/authMiddleware';
import { logAudit } from '../middleware/auditMiddleware';

const router = express.Router();

// ===== Supplier account management =====
router.post('/accounts', protect, authorize('MANAGER'), logAudit('SUPPLIER_ACCOUNT_CREATED'), createSupplierAccount);

// ===== RFQ management =====
router.post('/rfq', protect, authorize('STORE_MANAGER'), logAudit('RFQ_CREATED'), createRFQ);
router.get('/rfq', protect, authorize('STORE_MANAGER', 'ADMIN'), getRFQs);
router.get('/rfq/:rfqId/quotations', protect, authorize('STORE_MANAGER', 'ADMIN'), getQuotationsForRFQ);

// ===== Quotation management =====
router.put('/quotations/:id/accept', protect, authorize('STORE_MANAGER'), logAudit('QUOTATION_ACCEPTED'), acceptQuotation);

// ===== Purchase Order management (internal) =====
router.get('/purchase-orders', protect, authorize('STORE_MANAGER', 'ADMIN'), getAllPOs);

// ===== Supplier self-service =====
router.get('/my-rfq', protect, authorize('SUPPLIER'), getSupplierRFQs);
router.post('/quotation', protect, authorize('SUPPLIER'), logAudit('QUOTATION_SUBMITTED'), submitQuotation);
router.get('/my-purchase-orders', protect, authorize('SUPPLIER'), getSupplierPOs);
router.put('/purchase-orders/:id/confirm', protect, authorize('SUPPLIER'), logAudit('PO_CONFIRMED'), confirmPO);
router.post('/shipment', protect, authorize('SUPPLIER'), logAudit('SHIPMENT_CREATED'), createShipment);
router.get('/my-shipments', protect, authorize('SUPPLIER'), getSupplierShipments);

export default router;
