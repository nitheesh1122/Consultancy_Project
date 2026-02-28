import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker extends Document {
    workerId: string;
    name: string;
    role: string;
    skills: string[];
    phone?: string;
    status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
    joiningDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WorkerSchema: Schema = new Schema({
    workerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    skills: [{ type: String }],
    phone: { type: String },
    status: { type: String, enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'], default: 'ACTIVE' },
    joiningDate: { type: Date }
}, { timestamps: true });

export default mongoose.model<IWorker>('Worker', WorkerSchema);
