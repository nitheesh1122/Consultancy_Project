import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('Users found:', users.length);

        for (const user of users) {
            console.log(`User: ${user.username}, Role: '${user.role}'`);

            // Fix if role is incorrect case
            const role = user.role as string;

            if (role === 'Store Manager' || role === 'store_manager') {
                console.log(`Fixing role for ${user.username}...`);
                user.role = 'STORE_MANAGER';
                await user.save();
                console.log('Fixed.');
            } else if (role === 'Admin' || role === 'admin') {
                console.log(`Fixing role for ${user.username}...`);
                user.role = 'ADMIN';
                await user.save();
                console.log('Fixed.');
            } else if (role === 'Supervisor' || role === 'supervisor') {
                console.log(`Fixing role for ${user.username}...`);
                user.role = 'SUPERVISOR';
                await user.save();
                console.log('Fixed.');
            }
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
