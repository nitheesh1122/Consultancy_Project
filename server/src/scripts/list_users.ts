import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`Connected to DB: ${mongoose.connection.db?.databaseName}`);

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);
        console.log('--- USER ROLES ---');
        users.forEach(u => console.log(`${u.username}: ${u.role}`));
        console.log('------------------');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
