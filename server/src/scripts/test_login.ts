import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        const username = 'manager';
        // Note: I don't know the password, but I can check the User document directly without password for the ROLE.
        // Or I can verify what 'User.findOne' returns.

        const user = await User.findOne({ username });
        if (!user) {
            console.log('User manager not found');
            process.exit(1);
        }

        console.log('--- DB RECORD ---');
        console.log(`Username: ${user.username}`);
        console.log(`Role (Raw from DB): '${user.role}'`);

        // Simulate Token Generation
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '30d',
        });

        console.log('--- TOKEN PAYLOAD ---');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        console.log(`Role in Token: '${decoded.role}'`);

        if (decoded.role !== 'STORE_MANAGER') {
            console.error('CRITICAL: Token role is NOT STORE_MANAGER');
        } else {
            console.log('SUCCESS: Token role is correct.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

testLogin();
