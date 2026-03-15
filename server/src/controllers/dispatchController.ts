import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Dispatch } from '../models/Dispatch';
import { CustomerOrder } from '../models/CustomerOrder';
import { Customer } from '../models/Customer';
import { Notification } from '../models/Notification';
import { getIO } from '../socket';
import { manualLog } from '../middleware/auditMiddleware';

interface AuthRequest extends Request {
    user?: any;
}

// Generate dispatch number: DSP-YYYYMMDD-XXXX
const generateDispatchNumber = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Dispatch.countDocuments();
    return `DSP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// ===== Create Dispatch =====
export const createDispatch = async (req: AuthRequest, res: Response) => {
    try {
        const { customerOrderId, items, totalWeight, vehicleNumber, driverName, driverPhone, dispatchDate, expectedDelivery, deliveryAddress, invoiceNumber, invoiceAmount, remarks } = req.body;

        if (!customerOrderId || !vehicleNumber || !dispatchDate) {
            return res.status(400).json({ message: 'customerOrderId, vehicleNumber, and dispatchDate are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(String(customerOrderId))) {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        const dispatchDateObj = new Date(dispatchDate);
        if (Number.isNaN(dispatchDateObj.getTime())) {
            return res.status(400).json({ message: 'dispatchDate must be a valid date' });
        }

        if (expectedDelivery) {
            const expectedDeliveryObj = new Date(expectedDelivery);
            if (Number.isNaN(expectedDeliveryObj.getTime())) {
                return res.status(400).json({ message: 'expectedDelivery must be a valid date' });
            }
            if (expectedDeliveryObj < dispatchDateObj) {
                return res.status(400).json({ message: 'expectedDelivery cannot be before dispatchDate' });
            }
        }

        const vehiclePattern = /^[A-Z0-9-]{6,15}$/i;
        if (!vehiclePattern.test(String(vehicleNumber).trim())) {
            return res.status(400).json({ message: 'vehicleNumber format is invalid' });
        }

        const order = await CustomerOrder.findById(customerOrderId).populate('customerId');
        if (!order) return res.status(404).json({ message: 'Customer order not found' });
        if (order.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Order must be in COMPLETED status to dispatch' });
        }

        const dispatchNumber = await generateDispatchNumber();

        const dispatch = await Dispatch.create({
            dispatchNumber,
            customerOrderId,
            customerId: order.customerId,
            items: items || [{ description: `${order.fabricType} - ${order.color}`, quantity: order.quantity, unit: 'KG' }],
            totalWeight: totalWeight || order.quantity,
            vehicleNumber,
            driverName,
            driverPhone,
            dispatchDate,
            expectedDelivery,
            deliveryAddress,
            invoiceNumber,
            invoiceAmount: invoiceAmount || order.totalValue,
            status: 'DISPATCHED',
            dispatchedBy: req.user.id,
            remarks
        });

        // Update order status to DISPATCHED
        order.status = 'DISPATCHED';
        order.dispatchId = dispatch._id;
        await order.save();

        // Notify customer
        const customer = await Customer.findById(order.customerId);
        if (customer?.userId) {
            await Notification.create({
                recipient: customer.userId,
                type: 'INFO',
                message: `Your order ${order.orderNumber} has been dispatched (${dispatchNumber})`,
                link: `/customer/orders/${order._id}`
            });
            getIO().to(customer.userId.toString()).emit('notification', { type: 'dispatch', orderId: order._id });
        }

        // Notify manager
        await Notification.create({
            recipient: req.user.id,
            type: 'SUCCESS',
            message: `Dispatch ${dispatchNumber} created for order ${order.orderNumber}`,
            link: `/dispatch`
        });
        getIO().to('MANAGER').emit('dispatch:created', { dispatchId: dispatch._id, orderId: order._id });
        getIO().to('STORE_MANAGER').emit('dispatch:created', { dispatchId: dispatch._id, orderId: order._id });

        await manualLog('DISPATCH_CREATED', req.user.id, { dispatchId: dispatch._id, dispatchNumber, orderId: order._id });

        res.status(201).json(dispatch);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== Get All Dispatches =====
export const getAllDispatches = async (req: AuthRequest, res: Response) => {
    try {
        const dispatches = await Dispatch.find()
            .populate('customerOrderId', 'orderNumber fabricType color quantity status')
            .populate('customerId', 'name companyName')
            .populate('dispatchedBy', 'username')
            .sort({ createdAt: -1 });
        res.json(dispatches);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== Get Dispatch by Order =====
export const getDispatchByOrder = async (req: AuthRequest, res: Response) => {
    try {
        const orderId = String(req.params.orderId);
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        const dispatch = await Dispatch.findOne({ customerOrderId: orderId })
            .populate('customerOrderId', 'orderNumber fabricType color quantity status')
            .populate('customerId', 'name companyName')
            .populate('dispatchedBy', 'username');
        if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });
        res.json(dispatch);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== Update Dispatch Status =====
export const updateDispatchStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const dispatchId = String(req.params.id);
        if (!mongoose.Types.ObjectId.isValid(dispatchId)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        const dispatch = await Dispatch.findById(dispatchId);
        if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

        const validTransitions: Record<string, string[]> = {
            'PACKED': ['DISPATCHED'],
            'DISPATCHED': ['IN_TRANSIT'],
            'IN_TRANSIT': ['DELIVERED', 'RETURNED'],
        };

        const allowed = validTransitions[dispatch.status];
        if (!allowed || !allowed.includes(status)) {
            return res.status(400).json({ message: `Cannot transition from ${dispatch.status} to ${status}` });
        }

        dispatch.status = status;
        if (status === 'DELIVERED') {
            dispatch.deliveredAt = new Date();
            // Also update customer order to DELIVERED
            await CustomerOrder.findByIdAndUpdate(dispatch.customerOrderId, { status: 'DELIVERED' });
        }
        await dispatch.save();

        // Notify customer about status update
        const customer = await Customer.findById(dispatch.customerId);
        if (customer?.userId) {
            await Notification.create({
                recipient: customer.userId,
                type: 'INFO',
                message: `Dispatch ${dispatch.dispatchNumber} status: ${status}`,
                link: `/customer/orders/${dispatch.customerOrderId}`
            });
            getIO().to(customer.userId.toString()).emit('notification', { type: 'dispatch_status', status });
        }

        getIO().to('MANAGER').emit('dispatch:updated', { dispatchId: dispatch._id, status });
        getIO().to('STORE_MANAGER').emit('dispatch:updated', { dispatchId: dispatch._id, status });
        await manualLog('DISPATCH_STATUS_UPDATED', req.user.id, { dispatchId: dispatch._id, status });

        res.json(dispatch);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
