import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/consultancy_db';

const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'ADMIN' },
    { username: 'manager', password: 'manager123', role: 'MANAGER' },
    { username: 'store', password: 'store123', role: 'STORE_MANAGER' },
    { username: 'supervisor', password: 'supervisor123', role: 'SUPERVISOR' },
    { username: 'hr', password: 'hr123', role: 'HR_MANAGER' },
];

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    }));

    for (const u of defaultUsers) {
        const exists = await User.findOne({ username: u.username });
        if (exists) {
            if (exists.role !== u.role) {
                await User.updateOne({ username: u.username }, { role: u.role });
                console.log(`Updated role: ${u.username} -> ${u.role}`);
            } else {
                console.log(`User "${u.username}" already exists — skipping.`);
            }
            continue;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        await User.create({ username: u.username, password: hashedPassword, role: u.role });
        console.log(`Created user: ${u.username} (${u.role})`);
    }

    console.log('Seed complete.');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
