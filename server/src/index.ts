import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db';
import authRoutes from './routes/authRoutes';
import materialRoutes from './routes/materialRoutes';
import mrsRoutes from './routes/mrsRoutes';
import piRoutes from './routes/piRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import transactionRoutes from './routes/transactionRoutes';
import supplierRoutes from './routes/supplierRoutes';
import auditRoutes from './routes/auditRoutes';
import machineRoutes from './routes/machineRoutes';
import workerRoutes from './routes/workerRoutes';
import settingsRoutes from './routes/settingsRoutes';
import productionBatchRoutes from './routes/productionBatchRoutes';
import productionAnalyticsRoutes from './routes/productionAnalyticsRoutes';

import { createServer } from 'http';
import { initSocket } from './socket';
import { initCronJobs } from './utils/cronJobs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/mrs', mrsRoutes);
app.use('/api/pi', piRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/production-batches', productionBatchRoutes);
app.use('/api/production-analytics', productionAnalyticsRoutes);

app.get('/', (req, res) => {
    res.send('Inventory System API is running');
});

// Initialize automated scheduled jobs
if (process.env.NODE_ENV !== 'test') {
    initCronJobs();
}

const httpServer = createServer(app);
const io = initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
