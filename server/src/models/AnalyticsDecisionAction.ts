import mongoose, { Schema, Document } from 'mongoose';

export type DecisionActionStatus = 'CLICKED' | 'IGNORED' | 'RESOLVED';

export interface IAnalyticsDecisionAction extends Document {
    userId: mongoose.Types.ObjectId;
    role: string;
    decisionId: string;
    actionLink: string;
    status: DecisionActionStatus;
    contextWindow: string;
    createdAt: Date;
}

const AnalyticsDecisionActionSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        role: { type: String, required: true, index: true },
        decisionId: { type: String, required: true, index: true },
        actionLink: { type: String, required: true },
        status: {
            type: String,
            enum: ['CLICKED', 'IGNORED', 'RESOLVED'],
            required: true,
            index: true,
        },
        contextWindow: { type: String, required: true, default: '30d' },
    },
    { timestamps: true }
);

AnalyticsDecisionActionSchema.index({ decisionId: 1, createdAt: -1 });

export default mongoose.model<IAnalyticsDecisionAction>(
    'AnalyticsDecisionAction',
    AnalyticsDecisionActionSchema
);
