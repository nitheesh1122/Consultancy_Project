import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unit: { type: String, required: true }, // kg, ltr, pcs
    quantity: { type: Number, default: 0 },
    minStock: { type: Number, default: 10 },
    unitCost: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Material = mongoose.model('Material', materialSchema);
