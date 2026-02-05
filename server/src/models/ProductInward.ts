import mongoose from 'mongoose';

const piItemSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 } // Added for cost analytics
});

const piSchema = new mongoose.Schema({
    storeManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true }, // Link to Supplier
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Approver
    items: [piItemSchema],
    status: {
        type: String,
        default: 'RAISED',
        enum: ['RAISED', 'APPROVED', 'REJECTED', 'COMPLETED']
    },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
    approvedAt: { type: Date }, // Added for approval delay analytics
    approvalRemarks: { type: String }, // Admin approval remarks
    completedAt: { type: Date }
});

export const ProductInward = mongoose.model('ProductInward', piSchema);
