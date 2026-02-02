import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        const users = await User.find({});
        console.log('--- FINAL ROLE CHECK ---');
        users.forEach(u => console.log(`User: ${u.username} | Role: '${u.role}'`));
        console.log('------------------------');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
