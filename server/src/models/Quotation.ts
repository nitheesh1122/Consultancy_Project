import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true }
});

const quotationSchema = new mongoose.Schema({
    rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [quotationItemSchema],
    totalPrice: { type: Number, required: true },
    deliveryDays: { type: Number, required: true },
    paymentTerms: { type: String },
    remarks: { type: String },
    status: {
        type: String,
        default: 'SUBMITTED',
        enum: ['SUBMITTED', 'ACCEPTED', 'REJECTED']
    },
    submittedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
});

export const Quotation = mongoose.model('Quotation', quotationSchema);
