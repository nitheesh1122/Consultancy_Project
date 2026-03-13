import { Request, Response } from 'express';
import { RFQ } from '../models/RFQ';
import { Quotation } from '../models/Quotation';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Shipment } from '../models/Shipment';
import { Supplier } from '../models/Supplier';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { getIO } from '../socket';
import { manualLog } from '../middleware/auditMiddleware';
import bcrypt from 'bcryptjs';

interface AuthRequest extends Request {
    user?: any;
}

// ===== MANAGER: Create Supplier account =====
export const createSupplierAccount = async (req: AuthRequest, res: Response) => {
    try {
        const { username, password, supplierId } = req.body;

        if (!username || !password || !supplierId) {
            return res.status(400).json({ message: 'username, password, and supplierId are required' });
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            password: hashedPassword,
            role: 'SUPPLIER',
            profileId: supplier._id,
            createdBy: req.user.id
        });

        await manualLog('SUPPLIER_ACCOUNT_CREATED', req.user.id, { supplierId, username });
        res.status(201).json({ userId: user._id, username: user.username, supplierId });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER/STORE_MANAGER: Create RFQ =====
export const createRFQ = async (req: AuthRequest, res: Response) => {
    try {
        const { items, supplierIds, dueDate, remarks } = req.body;

        if (!items?.length || !supplierIds?.length) {
            return res.status(400).json({ message: 'items and supplierIds are required' });
        }

        const count = await RFQ.countDocuments();
        const rfqNumber = `RFQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

        const rfq = await RFQ.create({
            rfqNumber,
            items,
            sentToSuppliers: supplierIds,
            createdBy: req.user.id,
            dueDate,
            remarks
        });

        await manualLog('RFQ_CREATED', req.user.id, { rfqId: rfq._id, rfqNumber, supplierCount: supplierIds.length });

        // Notify supplier users
        for (const sId of supplierIds) {
            const supplierUsers = await User.find({ role: 'SUPPLIER', profileId: sId });
            for (const su of supplierUsers) {
                await Notification.create({
                    recipient: su._id,
                    message: `New RFQ ${rfqNumber} received. Submit your quotation.`,
                    type: 'INFO',
                    link: `/supplier/rfq/${rfq._id}`
                });
            }
        }

        try {
            getIO().to('SUPPLIER').emit('notification', { type: 'RFQ_CREATED', rfqNumber });
        } catch (e) { /* socket optional */ }

        res.status(201).json(rfq);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER/STORE_MANAGER: Get all RFQs =====
export const getRFQs = async (req: AuthRequest, res: Response) => {
    try {
        const rfqs = await RFQ.find()
            .populate('items.materialId', 'name code unit')
            .populate('sentToSuppliers', 'name contactPerson')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });
        res.json(rfqs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== SUPPLIER: Get my RFQs =====
export const getSupplierRFQs = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user?.profileId) {
            return res.status(400).json({ message: 'Supplier profile not linked' });
        }

        const rfqs = await RFQ.find({ sentToSuppliers: user.profileId, status: { $in: ['OPEN', 'QUOTATIONS_RECEIVED'] } })
            .populate('items.materialId', 'name code unit')
            .sort({ createdAt: -1 });

        res.json(rfqs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== SUPPLIER: Submit quotation =====
export const submitQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { rfqId, items, deliveryDays, paymentTerms, remarks } = req.body;

        if (!rfqId || !items?.length || !deliveryDays) {
            return res.status(400).json({ message: 'rfqId, items, and deliveryDays are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user?.profileId) {
            return res.status(400).json({ message: 'Supplier profile not linked' });
        }

        const rfq = await RFQ.findById(rfqId);
        if (!rfq) {
            return res.status(404).json({ message: 'RFQ not found' });
        }

        // Check supplier is part of the RFQ
        if (!rfq.sentToSuppliers.some((s: any) => s.toString() === user.profileId!.toString())) {
            return res.status(403).json({ message: 'You are not invited to this RFQ' });
        }

        const totalPrice = items.reduce((sum: number, i: any) => sum + (i.unitPrice * i.quantity), 0);

        const quotation = await Quotation.create({
            rfqId,
            supplierId: user.profileId,
            items,
            totalPrice,
            deliveryDays,
            paymentTerms,
            remarks
        });

        // Update RFQ status
        if (rfq.status === 'OPEN') {
            rfq.status = 'QUOTATIONS_RECEIVED';
            await rfq.save();
        }

        await manualLog('QUOTATION_SUBMITTED', req.user.id, { quotationId: quotation._id, rfqId, totalPrice });

        // Notify managers
        const managers = await User.find({ role: { $in: ['MANAGER', 'STORE_MANAGER'] } });
        for (const mgr of managers) {
            await Notification.create({
                recipient: mgr._id,
                message: `Quotation received for ${rfq.rfqNumber} - ₹${totalPrice.toLocaleString()}`,
                type: 'INFO',
                link: '/procurement/rfq'
            });
        }

        try {
            getIO().to('MANAGER').emit('notification', { type: 'QUOTATION_SUBMITTED', rfqNumber: rfq.rfqNumber });
        } catch (e) { /* socket optional */ }

        res.status(201).json(quotation);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER: Get quotations for an RFQ =====
export const getQuotationsForRFQ = async (req: AuthRequest, res: Response) => {
    try {
        const quotations = await Quotation.find({ rfqId: req.params.rfqId })
            .populate('supplierId', 'name contactPerson rating')
            .sort({ totalPrice: 1 });
        res.json(quotations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER: Accept quotation & create PO =====
export const acceptQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        quotation.status = 'ACCEPTED';
        quotation.respondedAt = new Date();
        await quotation.save();

        // Reject other quotations for same RFQ
        await Quotation.updateMany(
            { rfqId: quotation.rfqId, _id: { $ne: quotation._id } },
            { status: 'REJECTED', respondedAt: new Date() }
        );

        // Create PO
        const count = await PurchaseOrder.countDocuments();
        const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

        const po = await PurchaseOrder.create({
            poNumber,
            rfqId: quotation.rfqId,
            quotationId: quotation._id,
            supplierId: quotation.supplierId,
            items: quotation.items,
            totalAmount: quotation.totalPrice,
            createdBy: req.user.id,
            expectedDelivery: new Date(Date.now() + quotation.deliveryDays * 24 * 60 * 60 * 1000)
        });

        // Update RFQ status
        await RFQ.findByIdAndUpdate(quotation.rfqId, { status: 'PO_CREATED' });

        await manualLog('PO_CREATED_FROM_QUOTATION', req.user.id, { poId: po._id, poNumber, quotationId: quotation._id });

        // Notify supplier
        const supplierUsers = await User.find({ role: 'SUPPLIER', profileId: quotation.supplierId });
        for (const su of supplierUsers) {
            await Notification.create({
                recipient: su._id,
                message: `Purchase Order ${poNumber} issued to you. Please confirm.`,
                type: 'SUCCESS',
                link: `/supplier/purchase-orders`
            });
        }

        try {
            getIO().to('SUPPLIER').emit('notification', { type: 'PO_ISSUED', poNumber });
        } catch (e) { /* socket optional */ }

        res.json({ quotation, purchaseOrder: po });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== SUPPLIER: Get my purchase orders =====
export const getSupplierPOs = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user?.profileId) {
            return res.status(400).json({ message: 'Supplier profile not linked' });
        }

        const pos = await PurchaseOrder.find({ supplierId: user.profileId })
            .populate('items.materialId', 'name code unit')
            .sort({ createdAt: -1 });
        res.json(pos);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER: Get all purchase orders =====
export const getAllPOs = async (req: AuthRequest, res: Response) => {
    try {
        const pos = await PurchaseOrder.find()
            .populate('supplierId', 'name contactPerson')
            .populate('items.materialId', 'name code unit')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });
        res.json(pos);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== SUPPLIER: Confirm PO =====
export const confirmPO = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user?.profileId) {
            return res.status(400).json({ message: 'Supplier profile not linked' });
        }

        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        if (po.supplierId.toString() !== user.profileId.toString()) {
            return res.status(403).json({ message: 'Not your purchase order' });
        }
        if (po.status !== 'ISSUED') {
            return res.status(400).json({ message: `Cannot confirm PO in ${po.status} status` });
        }

        po.status = 'CONFIRMED';
        po.confirmedAt = new Date();
        await po.save();

        await manualLog('PO_CONFIRMED', req.user.id, { poId: po._id, poNumber: po.poNumber });

        // Notify managers
        const managers = await User.find({ role: { $in: ['MANAGER', 'STORE_MANAGER'] } });
        for (const mgr of managers) {
            await Notification.create({
                recipient: mgr._id,
                message: `PO ${po.poNumber} confirmed by supplier`,
                type: 'SUCCESS',
                link: '/procurement/purchase-orders'
            });
        }

        try {
            getIO().to('MANAGER').emit('notification', { type: 'PO_CONFIRMED', poNumber: po.poNumber });
        } catch (e) { /* socket optional */ }

        res.json(po);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== SUPPLIER: Create shipment =====
export const createShipment = async (req: AuthRequest, res: Response) => {
    try {
        const { purchaseOrderId, dispatchDate, vehicleNumber, driverName, driverPhone, expectedDelivery } = req.body;

        if (!purchaseOrderId || !dispatchDate || !vehicleNumber || !expectedDelivery) {
            return res.status(400).json({ message: 'purchaseOrderId, dispatchDate, vehicleNumber, expectedDelivery are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user?.profileId) {
            return res.status(400).json({ message: 'Supplier profile not linked' });
        }

        const po = await PurchaseOrder.findById(purchaseOrderId);
        if (!po) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }
        if (po.supplierId.toString() !== user.profileId.toString()) {
            return res.status(403).json({ message: 'Not your purchase order' });
        }

        const shipment = await Shipment.create({
            purchaseOrderId,
            supplierId: user.profileId,
            dispatchDate,
            vehicleNumber,
            driverName,
            driverPhone,
            expectedDelivery
        });

        // Update PO status
        po.status = 'SHIPPED';
        await po.save();

        await manualLog('SHIPMENT_CREATED', req.user.id, { shipmentId: shipment._id, poNumber: po.poNumber, vehicleNumber });

        // Notify store manager + manager
        const staff = await User.find({ role: { $in: ['MANAGER', 'STORE_MANAGER'] } });
        for (const s of staff) {
            await Notification.create({
                recipient: s._id,
                message: `Shipment dispatched for PO ${po.poNumber} — Vehicle: ${vehicleNumber}`,
                type: 'INFO',
                link: '/procurement/purchase-orders'
            });
        }

        try {
            getIO().to('MANAGER').emit('notification', { type: 'SHIPMENT_DISPATCHED', poNumber: po.poNumber });
            getIO().to('STORE_MANAGER').emit('notification', { type: 'SHIPMENT_DISPATCHED', poNumber: po.poNumber });
        } catch (e) { /* socket optional */ }

        res.status(201).json(shipment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== SUPPLIER: Get my shipments =====
export const getSupplierShipments = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user?.profileId) {
            return res.status(400).json({ message: 'Supplier profile not linked' });
        }

        const shipments = await Shipment.find({ supplierId: user.profileId })
            .populate('purchaseOrderId', 'poNumber totalAmount')
            .sort({ createdAt: -1 });
        res.json(shipments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
