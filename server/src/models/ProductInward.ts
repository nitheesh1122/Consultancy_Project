import mongoose from 'mongoose';

const piItemSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true }
});

const piSchema = new mongoose.Schema({
    storeManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Approver
    items: [piItemSchema],
    status: {
        type: String,
        default: 'RAISED',
        enum: ['RAISED', 'APPROVED', 'REJECTED', 'COMPLETED']
    },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
});

export const ProductInward = mongoose.model('ProductInward', piSchema);
