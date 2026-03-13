import mongoose from 'mongoose';

const poItemSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }
});

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: { type: String, required: true, unique: true },
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [poItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        default: 'ISSUED',
        enum: ['ISSUED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    confirmedAt: { type: Date },
    expectedDelivery: { type: Date },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

purchaseOrderSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
