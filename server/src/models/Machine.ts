import mongoose, { Schema, Document } from 'mongoose';

export interface IMachine extends Document {
    machineId: string;
    name: string;
    type: 'WINCH' | 'SOFT_FLOW' | 'JET_DYEING' | 'JIGGER' | 'HT_HP' | 'BEAM_DYEING';
    capacityKg: number;

    specifications?: {
        maxTemperatureC: number;
        maxPressure: number;
        liquorRatio: string;
        heatingSource: 'THERMIC_FLUID' | 'DIRECT_STEAM' | 'ELECTRIC' | 'GAS';
        waterRecycling: boolean;
        powerBackup: boolean;
    };

    operation?: {
        shiftCapacity: number;
        avgBatchTimeHours: number;
        maintenanceCycle: number;
        preferredFabrics: string[];
        excludedFabrics: string[];
    };

    financial?: {
        installationDate: Date;
        purchaseCost: number;
        supplierName: string;
        warrantyExpiry: Date;
        amcProvider?: string;
        amcExpiry?: Date;
    };

    infrastructure?: {
        location: string;
        powerConnection: 'THREE_PHASE' | 'SINGLE_PHASE';
        powerRatingKw: number;
        waterLineSize: string;
        steamConnection: boolean;
        effluentOutlet: string;
    };

    status: 'ACTIVE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
    lastMaintenanceDate?: Date;
    nextMaintenanceDue?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const MachineSchema: Schema = new Schema({
    machineId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['WINCH', 'SOFT_FLOW', 'JET_DYEING', 'JIGGER', 'HT_HP', 'BEAM_DYEING']
    },
    capacityKg: { type: Number, required: true, min: 1 },

    specifications: {
        maxTemperatureC: { type: Number },
        maxPressure: { type: Number },
        liquorRatio: { type: String },
        heatingSource: { type: String, enum: ['THERMIC_FLUID', 'DIRECT_STEAM', 'ELECTRIC', 'GAS'] },
        waterRecycling: { type: Boolean, default: false },
        powerBackup: { type: Boolean, default: false }
    },

    operation: {
        shiftCapacity: { type: Number },
        avgBatchTimeHours: { type: Number },
        maintenanceCycle: { type: Number },
        preferredFabrics: [{ type: String }],
        excludedFabrics: [{ type: String }]
    },

    financial: {
        installationDate: { type: Date },
        purchaseCost: { type: Number },
        supplierName: { type: String },
        warrantyExpiry: { type: Date },
        amcProvider: { type: String },
        amcExpiry: { type: Date }
    },

    infrastructure: {
        location: { type: String },
        powerConnection: { type: String, enum: ['THREE_PHASE', 'SINGLE_PHASE'] },
        powerRatingKw: { type: Number },
        waterLineSize: { type: String },
        steamConnection: { type: Boolean, default: false },
        effluentOutlet: { type: String }
    },

    status: { type: String, enum: ['ACTIVE', 'IN_USE', 'MAINTENANCE', 'RETIRED'], default: 'ACTIVE' },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDue: { type: Date }
}, { timestamps: true });

export default mongoose.model<IMachine>('Machine', MachineSchema);
