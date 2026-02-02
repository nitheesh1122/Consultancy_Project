
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Material } from '../models/Material';
import { Supplier } from '../models/Supplier';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        const suppliers = await Supplier.find({});
        if (suppliers.length === 0) {
            console.log('No suppliers found. Cannot assign supplierIds.');
            process.exit(1);
        }

        const materials = await Material.find({});
        console.log(`Found ${materials.length} materials.`);

        let updatedCount = 0;
        for (const material of materials) {
            if (!material.supplierId) {
                const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
                material.supplierId = randomSupplier._id as mongoose.Types.ObjectId;
                await material.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} materials with random suppliers.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
