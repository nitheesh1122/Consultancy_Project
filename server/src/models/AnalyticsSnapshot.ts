import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsSnapshot extends Document {
    snapshotDate: Date;
    role: string;
    window: string;
    payload: any;
    generatedAt: Date;
}

const AnalyticsSnapshotSchema: Schema = new Schema(
    {
        snapshotDate: { type: Date, required: true, index: true },
        role: { type: String, required: true, index: true },
        window: { type: String, required: true, index: true },
        payload: { type: Schema.Types.Mixed, required: true },
        generatedAt: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true }
);

AnalyticsSnapshotSchema.index({ snapshotDate: 1, role: 1, window: 1 }, { unique: true });

export default mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);
