import mongoose from 'mongoose';
import connectDB from './src/db';
import ProductionBatch from './src/models/ProductionBatch';
import Worker from './src/models/Worker';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await connectDB();

        // Wait for mongoose to build indexes
        await ProductionBatch.init();
        await Worker.init();

        const batchIndexes = await ProductionBatch.listIndexes();
        const workerIndexes = await Worker.listIndexes();

        console.log("=== ProductionBatch Indexes ===");
        console.log(JSON.stringify(batchIndexes, null, 2));

        console.log("=== Worker Indexes ===");
        console.log(JSON.stringify(workerIndexes, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
