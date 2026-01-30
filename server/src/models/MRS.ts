import mongoose from 'mongoose';

const mrsItemSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantityRequested: { type: Number, required: true },
    quantityIssued: { type: Number, default: 0 }
});

const mrsSchema = new mongoose.Schema({
    batchId: { type: String, required: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [mrsItemSchema],
    status: {
        type: String,
        default: 'PENDING',
        enum: ['PENDING', 'ISSUED', 'REJECTED', 'PARTIALLY_ISSUED']
    },
    createdAt: { type: Date, default: Date.now }
});

export const MRS = mongoose.model('MRS', mrsSchema);
