import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        required: true,

        enum: ['ADMIN', 'MANAGER', 'STORE_MANAGER', 'SUPERVISOR', 'HR_MANAGER', 'CUSTOMER', 'SUPPLIER']
    },
    profileId: { type: mongoose.Schema.Types.ObjectId, refPath: 'role' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
