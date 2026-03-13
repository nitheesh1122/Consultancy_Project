import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    leaveType: {
        type: String,
        required: true,
        enum: ['CASUAL', 'SICK', 'EARNED', 'EMERGENCY', 'UNPAID']
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        default: 'PENDING',
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

leaveRequestSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
