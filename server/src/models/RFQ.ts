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
        enum: ['OPEN', 'QUOTATIONS_RECEIVED', 'CLOSED', 'PO_CREATED']
    },
    dueDate: { type: Date },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

rfqSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const RFQ = mongoose.model('RFQ', rfqSchema);
