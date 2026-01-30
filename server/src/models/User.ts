import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ['ADMIN', 'SUPERVISOR', 'STORE_MANAGER']
    },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
