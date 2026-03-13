import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    date: { type: Date, required: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    shift: { type: String, enum: ['MORNING', 'EVENING', 'NIGHT'], required: true },
    status: {
        type: String,
        default: 'PRESENT',
        enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE']
    },
    overtimeHours: { type: Number, default: 0 },
    remarks: { type: String },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);
