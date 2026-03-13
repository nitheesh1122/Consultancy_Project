import mongoose, { Schema, Document } from 'mongoose';

export interface IMetricFormulaVersion extends Document {
    metricId: string;
    version: number;
    formula: string;
    thresholds: {
        warning?: string;
        critical?: string;
    };
    desiredDirection: 'up' | 'down';
    roles: string[];
    changedBy?: mongoose.Types.ObjectId;
    changeNote?: string;
    createdAt: Date;
}

const MetricFormulaVersionSchema: Schema = new Schema(
    {
        metricId: { type: String, required: true, index: true },
        version: { type: Number, required: true },
        formula: { type: String, required: true },
        thresholds: {
            warning: { type: String },
            critical: { type: String },
        },
        desiredDirection: { type: String, enum: ['up', 'down'], required: true },
        roles: [{ type: String, required: true }],
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changeNote: { type: String },
    },
    { timestamps: true }
);

MetricFormulaVersionSchema.index({ metricId: 1, version: -1 });

export default mongoose.model<IMetricFormulaVersion>('MetricFormulaVersion', MetricFormulaVersionSchema);
