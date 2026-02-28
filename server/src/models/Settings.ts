import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    utilityRates: {
        waterPerLiter: number;
        steamPerKg: number;
        electricityPerKwh: number;
    };
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
    utilityRates: {
        waterPerLiter: { type: Number, default: 0, min: 0 },
        steamPerKg: { type: Number, default: 0, min: 0 },
        electricityPerKwh: { type: Number, default: 0, min: 0 }
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: false, updatedAt: true } });

export default mongoose.model<ISettings>('Settings', SettingsSchema);
