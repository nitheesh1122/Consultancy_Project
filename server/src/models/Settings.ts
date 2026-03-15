import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    utilityRates: {
        waterPerLiter: number;
        steamPerKg: number;
        electricityPerKwh: number;
    };
    targetYieldPercentage?: number;
    dailyReportEmails?: string[];
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
    utilityRates: {
        waterPerLiter: { type: Number, default: 0, min: 0 },
        steamPerKg: { type: Number, default: 0, min: 0 },
        electricityPerKwh: { type: Number, default: 0, min: 0 }
    },
    targetYieldPercentage: { type: Number, default: 90, min: 0, max: 100 },
    dailyReportEmails: [{ type: String, trim: true, lowercase: true }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: false, updatedAt: true } });

export default mongoose.model<ISettings>('Settings', SettingsSchema);
