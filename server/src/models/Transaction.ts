import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['ISSUE', 'INWARD', 'ADJUSTMENT']
    },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true }, // Negative for issue, Positive for inward
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // MRS ID or PI ID
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
