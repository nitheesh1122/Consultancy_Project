import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    materialCategories: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export const Supplier = mongoose.model('Supplier', supplierSchema);
