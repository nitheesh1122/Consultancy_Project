import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

dotenv.config();

const createHRUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        const hrUser = await User.findOne({ username: 'HR' });
        if (hrUser) {
            console.log('HR user already exists');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin', salt);

            await User.create({
                username: 'HR',
                password: hashedPassword,
                role: 'HR_MANAGER'
            });
            console.log('HR user created successfully with username: HR, password: admin');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating HR user:', error);
        process.exit(1);
    }
};

createHRUser();
