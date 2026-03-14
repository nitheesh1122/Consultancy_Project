import mongoose from 'mongoose';

const rfqItemSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
});

const rfqSchema = new mongoose.Schema({
    rfqNumber: { type: String, required: true, unique: true },
    items: [rfqItemSchema],
    sentToSuppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        default: 'OPEN',
        enum: ['OPEN', 'QUOTATIONS_RECEIVED', 'PENDING_MANAGER_APPROVAL', 'MANAGER_APPROVED', 'PO_ISSUED', 'SUPPLIER_REJECTED', 'CLOSED', 'PO_CREATED']
    },
    dueDate: { type: Date },
    remarks: { type: String },
    submittedQuotationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' }],
    approvedSupplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    approvedQuotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    managerRemarks: { type: String },
    managerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isReRequest: { type: Boolean, default: false },
    originalRfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
    reRequestCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

rfqSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const RFQ = mongoose.model('RFQ', rfqSchema);
