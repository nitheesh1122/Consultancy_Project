import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema({
    dispatchNumber: { type: String, required: true, unique: true },
    customerOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerOrder', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [{
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'KG' }
    }],
    totalWeight: { type: Number },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String },
    driverPhone: { type: String },
    dispatchDate: { type: Date, required: true },
    expectedDelivery: { type: Date },
    deliveryAddress: { type: String },
    invoiceNumber: { type: String },
    invoiceAmount: { type: Number },
    status: {
        type: String,
        default: 'PACKED',
        enum: ['PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED']
    },
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deliveredAt: { type: Date },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

dispatchSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const Dispatch = mongoose.model('Dispatch', dispatchSchema);
