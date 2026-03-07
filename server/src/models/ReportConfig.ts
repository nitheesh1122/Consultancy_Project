import mongoose, { Schema, Document } from 'mongoose';

export interface IReportConfig extends Document {
    isDailyReportEnabled: boolean;
    dailyReportSchedule: string; // e.g. '0 8 * * *'
    lastReportSentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ReportConfigSchema: Schema = new Schema({
    isDailyReportEnabled: { type: Boolean, default: true },
    dailyReportSchedule: { type: String, default: '0 8 * * *' },
    lastReportSentAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IReportConfig>('ReportConfig', ReportConfigSchema);
