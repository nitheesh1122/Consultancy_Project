import mongoose, { Schema, Document } from 'mongoose';

export interface IFabricLot extends Document {
    lotNumber: string;
    supplierParty: string;
    fabricType: string;
    gsm?: number;
    totalRolls?: number;
    totalWeightKg: number;
    receivedDate: Date;
    status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED';
    supervisorId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const FabricLotSchema: Schema = new Schema({
    lotNumber: { type: String, required: true, unique: true },
    supplierParty: { type: String, required: true },
    fabricType: { type: String, required: true },
    gsm: { type: Number },
    totalRolls: { type: Number },
    totalWeightKg: { type: Number, required: true, min: 0 },
    receivedDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'IN_PRODUCTION', 'COMPLETED'], default: 'PENDING' },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

FabricLotSchema.index({ status: 1 });

export default mongoose.model<IFabricLot>('FabricLot', FabricLotSchema);
