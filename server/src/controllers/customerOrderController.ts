import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { CustomerOrder } from '../models/CustomerOrder';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { getIO } from '../socket';
import { manualLog } from '../middleware/auditMiddleware';
import bcrypt from 'bcryptjs';

interface AuthRequest extends Request {
    user?: any;
}

// Generate unique order number: ORD-YYYYMMDD-XXXX
const generateOrderNumber = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await CustomerOrder.countDocuments();
    return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// ===== ADMIN: Create Customer with login =====
export const createCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { name, companyName, contact, email, address, username, password } = req.body;

        if (!name || !companyName || !contact || !email || !username || !password) {
            return res.status(400).json({ message: 'All fields (name, companyName, contact, email, username, password) are required' });
        }

        // Check if username is taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create user account
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            username,
            password: hashedPassword,
            role: 'CUSTOMER',
            createdBy: req.user.id
        });

        // Create customer profile
        const customer = await Customer.create({
            name,
            companyName,
            contact,
            email,
            address,
            userId: user._id,
            createdBy: req.user.id
        });

        // Link profile to user
        user.profileId = customer._id;
        await user.save();

        await manualLog('CUSTOMER_CREATED', req.user.id, { customerId: customer._id, name, companyName });

        res.status(201).json(customer);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== ADMIN/MANAGER: Get all customers =====
export const getCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const customers = await Customer.find().populate('userId', 'username role').sort({ createdAt: -1 });
        res.json(customers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== CUSTOMER: Place order =====
export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { fabricType, fabricGSM, color, shadeCode, quantity, deliveryDate, specialInstructions, pricePerKg } = req.body;

        if (!fabricType || !color || !quantity || !deliveryDate || !pricePerKg) {
            return res.status(400).json({ message: 'fabricType, color, quantity, deliveryDate, and pricePerKg are required' });
        }

        // Find customer profile linked to this user
        const customer = await Customer.findOne({ userId: req.user.id });
        if (!customer) {
            return res.status(404).json({ message: 'Customer profile not found' });
        }

        const orderNumber = await generateOrderNumber();
        const totalValue = quantity * pricePerKg;

        const order = await CustomerOrder.create({
            orderNumber,
            customerId: customer._id,
            fabricType,
            fabricGSM,
            color,
            shadeCode,
            quantity,
            deliveryDate,
            specialInstructions,
            pricePerKg,
            totalValue,
            status: 'PLACED'
        });

        await manualLog('ORDER_PLACED', req.user.id, { orderId: order._id, orderNumber, totalValue });

        // Notify all managers
        const managers = await User.find({ role: 'MANAGER' });
        for (const mgr of managers) {
            await Notification.create({
                recipient: mgr._id,
                message: `New order ${orderNumber} placed by ${customer.companyName} — ₹${totalValue.toLocaleString()}`,
                type: 'INFO',
                link: '/customer-orders'
            });
        }

        try {
            getIO().to('MANAGER').emit('notification', { type: 'ORDER_CREATED', orderNumber });
        } catch (e) { /* socket optional */ }

        res.status(201).json(order);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== CUSTOMER: Get my orders =====
export const getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
        const customer = await Customer.findOne({ userId: req.user.id });
        if (!customer) {
            return res.status(404).json({ message: 'Customer profile not found' });
        }

        const orders = await CustomerOrder.find({ customerId: customer._id })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== CUSTOMER: Get order by ID =====
export const getOrderById = async (req: AuthRequest, res: Response) => {
    try {
        const order = await CustomerOrder.findById(req.params.id)
            .populate('customerId', 'name companyName contact email')
            .populate('approvedBy', 'username');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If customer, verify ownership
        if (req.user.role === 'CUSTOMER') {
            const customer = await Customer.findOne({ userId: req.user.id });
            if (!customer || order.customerId._id.toString() !== customer._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this order' });
            }
        }

        res.json(order);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER: Get all orders =====
export const getAllOrders = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;
        const filter: any = {};
        if (status) filter.status = status;

        const orders = await CustomerOrder.find(filter)
            .populate('customerId', 'name companyName contact email')
            .populate('approvedBy', 'username')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER: Approve order =====
export const approveOrder = async (req: AuthRequest, res: Response) => {
    try {
        const order = await CustomerOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.status !== 'PLACED') {
            return res.status(400).json({ message: `Cannot approve order in ${order.status} status` });
        }

        order.status = 'APPROVED';
        order.approvedBy = req.user.id;
        order.approvedAt = new Date();
        order.remarks = req.body.remarks || '';
        await order.save();

        await manualLog('ORDER_APPROVED', req.user.id, { orderId: order._id, orderNumber: order.orderNumber });

        // Notify customer
        const customer = await Customer.findById(order.customerId);
        if (customer?.userId) {
            await Notification.create({
                recipient: customer.userId,
                message: `Your order ${order.orderNumber} has been approved`,
                type: 'SUCCESS',
                link: `/customer/orders/${order._id}`
            });
            try {
                getIO().to(customer.userId.toString()).emit('notification', { type: 'ORDER_APPROVED', orderNumber: order.orderNumber });
            } catch (e) { /* socket optional */ }
        }

        res.json(order);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ===== MANAGER: Update order status =====
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status, remarks } = req.body;
        const validStatuses = ['PLACED', 'APPROVED', 'FABRIC_RECEIVED', 'IN_PRODUCTION', 'COMPLETED', 'DISPATCHED', 'DELIVERED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await CustomerOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        if (remarks) order.remarks = remarks;
        await order.save();

        await manualLog('ORDER_STATUS_UPDATED', req.user.id, { orderId: order._id, orderNumber: order.orderNumber, newStatus: status });

        // Notify customer
        const customer = await Customer.findById(order.customerId);
        if (customer?.userId) {
            await Notification.create({
                recipient: customer.userId,
                message: `Order ${order.orderNumber} status updated to ${status}`,
                type: 'INFO',
                link: `/customer/orders/${order._id}`
            });
            try {
                getIO().to(customer.userId.toString()).emit('notification', { type: 'ORDER_STATUS_UPDATED', orderNumber: order.orderNumber, status });
            } catch (e) { /* socket optional */ }
        }

        res.json(order);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
