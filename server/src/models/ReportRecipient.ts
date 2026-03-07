import mongoose, { Schema, Document } from 'mongoose';

export interface IReportRecipient extends Document {
    email: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ReportRecipientSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IReportRecipient>('ReportRecipient', ReportRecipientSchema);
