import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker extends Document {
    workerId: string;
    name: string;
    phone: string;
    role: 'HELPER' | 'OPERATOR' | 'SENIOR_OPERATOR' | 'SUPERVISOR' | 'TECHNICIAN' | 'LAB_ASSISTANT';
    status: 'ACTIVE' | 'BUSY' | 'ON_LEAVE' | 'INACTIVE';
    assignedMachine?: string;
    lastAssignedAt?: Date;

    personal?: {
        dateOfBirth: Date;
        gender: 'MALE' | 'FEMALE' | 'OTHER';
        bloodGroup?: string;
        address: {
            street: string;
            city: string;
            state: string;
            pincode: string;
            isLocal: boolean;
        };
        emergencyContact: {
            name: string;
            relation: string;
            phone: string;
        };
        photoUrl?: string;
    };

    employment?: {
        joiningDate: Date;
        experienceYears: number;
        previousEmployer?: string;
        referralSource?: string;
        isMigrantWorker: boolean;
        nativeState?: string;
        accommodation?: 'FACTORY_HOSTEL' | 'RENTED_ROOM' | 'OWN_ARRANGEMENT';
        messFacility: boolean;
        esiNumber?: string;
        pfNumber?: string;
        uanNumber?: string;
        bankAccount?: {
            accountName: string;
            accountNumber: string;
            bankName: string;
            ifscCode: string;
        };
    };

    skills?: {
        machineTypes: string[];
        fabricSpecialization: string[];
        shadeMatching: boolean;
        chemicalHandling: boolean;
        firstAidTrained: boolean;
        languages: string[];
    };

    performance?: {
        currentSkillLevel: number;
        totalBatchesCompleted: number;
        avgYieldPercentage: number;
        safetyIncidents: number;
        attendanceScore: number;
    };

    createdAt: Date;
    updatedAt: Date;
}

const WorkerSchema: Schema = new Schema({
    workerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['HELPER', 'OPERATOR', 'SENIOR_OPERATOR', 'SUPERVISOR', 'TECHNICIAN', 'LAB_ASSISTANT'], required: true },
    status: { type: String, enum: ['ACTIVE', 'BUSY', 'ON_LEAVE', 'INACTIVE'], default: 'ACTIVE' },
    assignedMachine: { type: String },
    lastAssignedAt: { type: Date },

    personal: {
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
        bloodGroup: { type: String },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            pincode: { type: String },
            isLocal: { type: Boolean, default: true }
        },
        emergencyContact: {
            name: { type: String },
            relation: { type: String },
            phone: { type: String }
        },
        photoUrl: { type: String }
    },

    employment: {
        joiningDate: { type: Date },
        experienceYears: { type: Number, default: 0 },
        previousEmployer: { type: String },
        referralSource: { type: String },
        isMigrantWorker: { type: Boolean, default: false },
        nativeState: { type: String },
        accommodation: { type: String, enum: ['FACTORY_HOSTEL', 'RENTED_ROOM', 'OWN_ARRANGEMENT'] },
        messFacility: { type: Boolean, default: false },
        esiNumber: { type: String },
        pfNumber: { type: String },
        uanNumber: { type: String },
        bankAccount: {
            accountName: { type: String },
            accountNumber: { type: String },
            bankName: { type: String },
            ifscCode: { type: String }
        }
    },

    skills: {
        machineTypes: [{ type: String }],
        fabricSpecialization: [{ type: String }],
        shadeMatching: { type: Boolean, default: false },
        chemicalHandling: { type: Boolean, default: false },
        firstAidTrained: { type: Boolean, default: false },
        languages: [{ type: String }]
    },

    performance: {
        currentSkillLevel: { type: Number, default: 1 },
        totalBatchesCompleted: { type: Number, default: 0 },
        avgYieldPercentage: { type: Number, default: 0 },
        safetyIncidents: { type: Number, default: 0 },
        attendanceScore: { type: Number, default: 100 }
    }
}, { timestamps: true });

export default mongoose.model<IWorker>('Worker', WorkerSchema);
