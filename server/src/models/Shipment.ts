import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    dispatchDate: { type: Date, required: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String },
    driverPhone: { type: String },
    expectedDelivery: { type: Date, required: true },
    actualDelivery: { type: Date },
    status: {
        type: String,
        default: 'IN_TRANSIT',
        enum: ['IN_TRANSIT', 'DELIVERED', 'DELAYED']
    },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export const Shipment = mongoose.model('Shipment', shipmentSchema);
