
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Material } from '../models/Material';
import { Supplier } from '../models/Supplier';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        const materials = await Material.find({}).limit(1).lean();
        console.log('First Material SupplierID:', materials[0]?.supplierId);

        const unassigned = await Material.countDocuments({ supplierId: { $exists: false } });
        console.log(`Unassigned materials: ${unassigned}`);

        const total = await Material.countDocuments({});
        console.log(`Total materials: ${total}`);

        if (unassigned === 0 && total > 0) {
            console.log('VERIFICATION SUCCESS: All materials have suppliers.');
        } else {
            console.log('VERIFICATION FAILED');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verify();
