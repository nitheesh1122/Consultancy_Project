import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionBatch extends Document {
    batchNumber: string;
    supervisorId: mongoose.Types.ObjectId;
    machineId: mongoose.Types.ObjectId;

    scheduledDate: Date;
    shift: 'MORNING' | 'EVENING' | 'NIGHT';

    lotNumber: string;
    fabricType: string;
    gsm?: number;
    inputKg: number;
    rolls?: number;
    supplierParty: string;

    shadeTarget: string;
    mrsId?: mongoose.Types.ObjectId;
    assignedWorkers: mongoose.Types.ObjectId[];

    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startTime?: Date;
    endTime?: Date;

    outputFirstGradeKg?: number;
    outputSecondGradeKg?: number;
    rejectionKg?: number;

    yieldPercentage?: number;
    qualityYieldPercentage?: number; // Added field
    wastagePercentage?: number;

    quality?: {
        labApproval?: boolean;
        shadeMatchRating?: number;
        fastnessRating?: number;
    };

    wastage?: {
        reason?: 'MACHINE_FAILURE' | 'OPERATOR_ERROR' | 'POOR_MATERIAL' | 'SHADE_MISMATCH' | 'OTHER';
        remarks?: string;
        preventable?: boolean;
    };

    utilities?: {
        waterLiters?: number;
        steamKg?: number;
        electricityKwh?: number;
    };

    calculatedCosts?: {
        materialCost?: number;
        utilityCost?: number;
        totalCostPerKg?: number;
    };

    createdAt: Date;
    updatedAt: Date;
}

const ProductionBatchSchema: Schema = new Schema({
    batchNumber: { type: String, required: true, unique: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', required: true },

    scheduledDate: { type: Date, required: true },
    shift: { type: String, enum: ['MORNING', 'EVENING', 'NIGHT'], required: true },

    lotNumber: { type: String, required: true },
    fabricType: { type: String, required: true },
    gsm: { type: Number, min: 1 },
    inputKg: { type: Number, required: true, min: 0 },
    rolls: { type: Number, min: 1 },
    supplierParty: { type: String, required: true },

    shadeTarget: { type: String, required: true },
    mrsId: { type: Schema.Types.ObjectId, ref: 'MRS' }, // Assuming MRS model exists as named
    assignedWorkers: [{ type: Schema.Types.ObjectId, ref: 'Worker' }],

    status: { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
    startTime: { type: Date },
    endTime: { type: Date },

    outputFirstGradeKg: { type: Number, min: 0 },
    outputSecondGradeKg: { type: Number, min: 0 },
    rejectionKg: { type: Number, min: 0 },

    yieldPercentage: { type: Number, min: 0, max: 200 }, // Allowing over 100 for edge cases/moisture, but bound validation is applied at API level
    wastagePercentage: { type: Number, min: 0, max: 100 },

    quality: {
        labApproval: { type: Boolean },
        shadeMatchRating: { type: Number, min: 1, max: 5 },
        fastnessRating: { type: Number, min: 1, max: 5 }
    },

    wastage: {
        reason: { type: String, enum: ['MACHINE_FAILURE', 'OPERATOR_ERROR', 'POOR_MATERIAL', 'SHADE_MISMATCH', 'OTHER'] },
        remarks: { type: String },
        preventable: { type: Boolean, default: false }
    },

    utilities: {
        waterLiters: { type: Number, min: 0 },
        steamKg: { type: Number, min: 0 },
        electricityKwh: { type: Number, min: 0 }
    },

    calculatedCosts: {
        materialCost: { type: Number, min: 0 },
        utilityCost: { type: Number, min: 0 },
        totalCostPerKg: { type: Number, min: 0 }
    }
}, { timestamps: true });

// Basic index for common queries
ProductionBatchSchema.index({ status: 1 });
ProductionBatchSchema.index({ machineId: 1, status: 1 });
ProductionBatchSchema.index({ lotNumber: 1 });

export default mongoose.model<IProductionBatch>('ProductionBatch', ProductionBatchSchema);
