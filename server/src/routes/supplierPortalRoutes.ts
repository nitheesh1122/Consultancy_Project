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
        getSupplierShipments,
        submitQuotationsForApproval,
        getManagerPendingRFQs,
        managerApproveRFQ,
        managerRejectRFQ,
        generatePOFromRFQ,
        supplierRespondToPO
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
router.put('/rfq/:rfqId/submit-for-approval', protect, authorize('STORE_MANAGER'), logAudit('RFQ_SUBMITTED_FOR_APPROVAL'), submitQuotationsForApproval);
router.get('/rfq/pending-approval', protect, authorize('MANAGER'), getManagerPendingRFQs);
router.put('/rfq/:rfqId/manager-approve', protect, authorize('MANAGER'), logAudit('RFQ_MANAGER_APPROVED'), managerApproveRFQ);
router.put('/rfq/:rfqId/manager-reject', protect, authorize('MANAGER'), managerRejectRFQ);
router.post('/rfq/:rfqId/generate-po', protect, authorize('STORE_MANAGER'), logAudit('PO_GENERATED'), generatePOFromRFQ);

// ===== Purchase Order management (internal) =====
router.get('/purchase-orders', protect, authorize('STORE_MANAGER', 'ADMIN'), getAllPOs);

// ===== Supplier self-service =====
router.get('/my-rfq', protect, authorize('SUPPLIER'), getSupplierRFQs);
router.post('/quotation', protect, authorize('SUPPLIER'), logAudit('QUOTATION_SUBMITTED'), submitQuotation);
router.get('/my-purchase-orders', protect, authorize('SUPPLIER'), getSupplierPOs);
router.put('/purchase-orders/:id/confirm', protect, authorize('SUPPLIER'), logAudit('PO_CONFIRMED'), confirmPO);
router.put('/purchase-orders/:id/respond', protect, authorize('SUPPLIER'), logAudit('PO_RESPONDED'), supplierRespondToPO);
router.post('/shipment', protect, authorize('SUPPLIER'), logAudit('SHIPMENT_CREATED'), createShipment);
router.get('/my-shipments', protect, authorize('SUPPLIER'), getSupplierShipments);

export default router;
