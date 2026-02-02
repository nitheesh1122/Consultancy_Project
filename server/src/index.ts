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

app.get('/', (req, res) => {
    res.send('Inventory System API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
