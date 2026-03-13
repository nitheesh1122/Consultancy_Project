import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
    name: { type: String, required: true, enum: ['MORNING', 'EVENING', 'NIGHT'] },
    startTime: { type: String, required: true }, // "06:00"
    endTime: { type: String, required: true },   // "14:00"
    date: { type: Date, required: true },
    workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
    capacity: { type: Number, default: 20 },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

shiftSchema.index({ name: 1, date: 1 }, { unique: true });

shiftSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const Shift = mongoose.model('Shift', shiftSchema);
