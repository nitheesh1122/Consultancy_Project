import mongoose, { Schema, Document } from 'mongoose';

export interface IMachine extends Document {
    machineId: string;
    name: string;
    type: string;
    capacityKg: number;
    location?: string;
    status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
    lastMaintenanceDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MachineSchema: Schema = new Schema({
    machineId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    capacityKg: { type: Number, required: true, min: 1 },
    location: { type: String },
    status: { type: String, enum: ['ACTIVE', 'MAINTENANCE', 'RETIRED'], default: 'ACTIVE' },
    lastMaintenanceDate: { type: Date }
}, { timestamps: true });

export default mongoose.model<IMachine>('Machine', MachineSchema);
