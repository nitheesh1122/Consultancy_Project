import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User';

dotenv.config();

const seedData = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/consultancy_db');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Clear existing users
        await User.deleteMany({});
        console.log('Users cleared');

        // Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN'
        });

        console.log('Admin User Created:', adminUser.username);

        // Create Supervisor
        const supervisorPassword = await bcrypt.hash('supervisor123', salt);
        await User.create({
            username: 'supervisor',
            password: supervisorPassword,
            role: 'SUPERVISOR'
        });
        console.log('Supervisor User Created');

        // Create Store Manager
        const managerPassword = await bcrypt.hash('manager123', salt);
        await User.create({
            username: 'manager',
            password: managerPassword,
            role: 'STORE_MANAGER'
        });
        console.log('Store Manager Created');

        // Clear existing materials
        await mongoose.connection.collection('materials').deleteMany({});
        console.log('Materials cleared');

        const materials = [
            // DYES
            { name: 'BLACK B (SF) Divine', unit: 'kg' },
            { name: 'BLACK GDRE / DEEP BLACK', unit: 'kg' },
            { name: 'RED W3R (Divine)', unit: 'kg' },
            { name: 'RED HDR (Divine)', unit: 'kg' },
            { name: 'RED F3B (Divine)', unit: 'kg' },
            { name: 'RED ME3BL (Divine)', unit: 'kg' },
            { name: 'RED F2G (CT)', unit: 'kg' },
            { name: 'ORANGE W3R (Divine)', unit: 'kg' },
            { name: 'ORANGE ME2RL (CT)', unit: 'kg' },
            { name: 'YELLOW MERL (CT & Divine)', unit: 'kg' },
            { name: 'YELLOW RNL (Divine) - Gtd', unit: 'kg' },
            { name: 'YELLOW ME4GL (Divine)', unit: 'kg' },
            { name: 'SKY BLUE G (CT)', unit: 'kg' },
            { name: 'BLUE ME2RL / ROYAL BLUE (Divine)', unit: 'kg' },
            { name: 'BLUE HEGN (Divine)', unit: 'kg' },
            { name: 'BLUE FNG (Dynex)', unit: 'kg' },
            { name: 'Deep T. Blue (Divine) G', unit: 'kg' },
            { name: 'MOSAIC BLUE (Divine)', unit: 'kg' },
            { name: 'GREEN HE4BD (Divine)', unit: 'kg' },
            { name: 'VIOLET ME2RL (Divine)', unit: 'kg' },
            { name: 'BLUE RR (Divine)', unit: 'kg' },
            { name: 'RED RR (Divine)', unit: 'kg' },
            { name: 'YELLOW RR (Divine)', unit: 'kg' },
            { name: 'BLUE RD (CT)', unit: 'kg' },
            { name: 'RED RD (CT)', unit: 'kg' },
            { name: 'YELLOW RD (CT)', unit: 'kg' },

            // CHEMICALS (Image 1)
            { name: 'Wetting Oil - BMW/CFLD (Venus)', unit: 'ltr' },
            { name: 'SOAPING OIL - OL 40 (Venus)', unit: 'ltr' },
            { name: 'MICRO SIL 60 (Venus)', unit: 'kg' },
            { name: 'Peroxide Killer Levocol NZCK (CT)', unit: 'kg' },
            { name: 'Corealcolic Levocol N Conc (CT)', unit: 'kg' },
            { name: 'LEVOCOL CMCN M/c.Clean(CT)', unit: 'kg' },
            { name: 'FIXING - NFDF-70', unit: 'kg' },
            { name: 'SOFTNER CAKES', unit: 'kg' },
            { name: 'DECOLORING-CW08 / BW08', unit: 'kg' },
            { name: 'AN IONIC Settling Poly(APAM)', unit: 'kg' },
            { name: 'Cat Ionic Poly (CPAM) / C22', unit: 'kg' },
            { name: 'POTASSIUM PERSULPHATE (RAW)', unit: 'kg' },
            { name: 'PADAMAL FIXING', unit: 'kg' },
            { name: 'ACRYLA MIDE', unit: 'kg' },

            // CHEMICALS (Image 2)
            { name: 'ACETIC ACID 30%', unit: 'ltr' },
            { name: 'CAUSTIC', unit: 'kg' },
            { name: 'EZY SOFT UNI (BIO)', unit: 'kg' },
            { name: 'LUBRICANT OIL (IGC)', unit: 'ltr' },
            { name: 'SODIUM CARBONATE', unit: 'kg' },
            { name: 'PEROXIDE', unit: 'ltr' },
            { name: 'PLASTIC OIL', unit: 'ltr' },
            { name: 'SKAY WHIT BBN CONC BLUE', unit: 'kg' },
            { name: 'SALT (F.Flow)', unit: 'kg' },
            { name: 'SODIUM SULPHATE', unit: 'kg' },
            { name: 'SODA ASH', unit: 'kg' }
        ];

        await mongoose.connection.collection('materials').insertMany(
            materials.map(m => ({ ...m, quantity: 100, minStock: 20, unitCost: 100, createdAt: new Date(), updatedAt: new Date() }))
        );
        console.log(`Seeded ${materials.length} materials`);

        // Fetch seeded materials
        const allMaterials = await mongoose.connection.collection('materials').find().toArray();
        const mat1 = allMaterials[0];
        const mat2 = allMaterials[1];
        const mat3 = allMaterials[2];

        // --- MOCK MRS ---
        console.log('Seeding Mock MRS...');
        const mrsList = [
            {
                batchId: 'BATCH-001',
                supervisorId: (await User.findOne({ username: 'supervisor' }))?._id,
                items: [
                    { materialId: mat1._id, quantityRequested: 10, quantityIssued: 10 },
                    { materialId: mat2._id, quantityRequested: 5, quantityIssued: 5 }
                ],
                status: 'ISSUED',
                createdAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
            },
            {
                batchId: 'BATCH-002',
                supervisorId: (await User.findOne({ username: 'supervisor' }))?._id,
                items: [
                    { materialId: mat3._id, quantityRequested: 50, quantityIssued: 0 }
                ],
                status: 'PENDING',
                createdAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
            }
        ];
        await mongoose.connection.collection('mrs').insertMany(mrsList);

        // --- MOCK PI ---
        console.log('Seeding Mock PIs...');
        const piList = [
            {
                storeManagerId: (await User.findOne({ username: 'manager' }))?._id,
                items: [{ materialId: mat1._id, quantity: 200 }],
                reason: 'Restocking Black Dye',
                status: 'APPROVED',
                adminId: (await User.findOne({ username: 'admin' }))?._id,
                createdAt: new Date(Date.now() - 86400000 * 3)
            },
            {
                storeManagerId: (await User.findOne({ username: 'manager' }))?._id,
                items: [{ materialId: mat3._id, quantity: 500 }],
                reason: 'High demand expected',
                status: 'RAISED',
                createdAt: new Date(Date.now() - 3600000) // 1 hour ago
            }
        ];
        await mongoose.connection.collection('productinwards').insertMany(piList);

        // --- MOCK TRANSACTIONS (For Analytics) ---
        console.log('Seeding Mock Transactions...');
        // Transaction for MRS BATCH-001 Issue
        const transactions = [
            {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'ISSUE',
                materialId: mat1._id,
                quantity: -10,
                performedBy: (await User.findOne({ username: 'manager' }))?._id,
                timestamp: new Date(Date.now() - 86400000 * 5)
            },
            {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'ISSUE',
                materialId: mat2._id,
                quantity: -5,
                performedBy: (await User.findOne({ username: 'manager' }))?._id,
                timestamp: new Date(Date.now() - 86400000 * 5)
            }
        ];
        await mongoose.connection.collection('transactions').insertMany(transactions);

        // --- MOCK NOTIFICATIONS ---
        console.log('Seeding Mock Notifications...');
        const notifications = [
            {
                recipient: (await User.findOne({ username: 'manager' }))?._id,
                message: 'PI for "Black Dye" has been APPROVED.',
                type: 'SUCCESS',
                read: false,
                createdAt: new Date()
            },
            {
                recipient: (await User.findOne({ username: 'supervisor' }))?._id,
                message: 'Your Material Request BATCH-001 has been Fully Issued.',
                type: 'SUCCESS',
                read: true,
                createdAt: new Date(Date.now() - 86400000 * 5)
            }
        ];
        await mongoose.connection.collection('notifications').insertMany(notifications);

        console.log('Mock Data Seeded Successfully');

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
