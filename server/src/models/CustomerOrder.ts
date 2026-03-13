import mongoose from 'mongoose';

const customerOrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    fabricType: { type: String, required: true },
    fabricGSM: { type: Number },
    color: { type: String, required: true },
    shadeCode: { type: String },
    quantity: { type: Number, required: true }, // in KG
    deliveryDate: { type: Date, required: true },
    specialInstructions: { type: String },
    pricePerKg: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    status: {
        type: String,
        default: 'PLACED',
        enum: ['PLACED', 'APPROVED', 'FABRIC_RECEIVED', 'IN_PRODUCTION', 'COMPLETED', 'DISPATCHED', 'DELIVERED']
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    productionBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionBatch' },
    dispatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

customerOrderSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const CustomerOrder = mongoose.model('CustomerOrder', customerOrderSchema);
