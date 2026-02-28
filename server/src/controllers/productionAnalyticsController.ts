import { Request, Response } from 'express';
import ProductionBatch from '../models/ProductionBatch';

// @desc    Get production overview analytics
// @route   GET /api/production-analytics/dashboard
// @access  Private (Admin)
export const getProductionDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch completed batches from the last 30 days
        const batches = await ProductionBatch.find({
            status: 'COMPLETED',
            endTime: { $gte: thirtyDaysAgo }
        }).populate('machineId', 'name').lean();

        if (batches.length === 0) {
            res.json({ message: 'No production data in the last 30 days', metrics: null });
            return;
        }

        // 1. Overall Yield Trend
        const yieldData = batches.map(b => ({
            date: b.endTime?.toISOString().split('T')[0],
            yield: b.yieldPercentage,
            batchNumber: b.batchNumber
        }));

        const avgYield = batches.reduce((sum, b) => sum + (b.yieldPercentage || 0), 0) / batches.length;

        // 2. Wastage Analysis (Group by Reason)
        const wastageByReason: Record<string, number> = {};
        batches.forEach(b => {
            if (b.wastage && b.wastage.reason && b.rejectionKg) {
                wastageByReason[b.wastage.reason] = (wastageByReason[b.wastage.reason] || 0) + b.rejectionKg;
            }
        });

        const formattedWastage = Object.entries(wastageByReason).map(([reason, kg]) => ({ reason, kg }));

        // 3. Machine Utilization
        const machineUsage: Record<string, number> = {};
        batches.forEach(b => {
            const machineName = (b.machineId as any)?.name || 'Unknown';
            machineUsage[machineName] = (machineUsage[machineName] || 0) + 1;
        });

        const formattedMachines = Object.entries(machineUsage).map(([name, count]) => ({ name, batchesRun: count }));

        // 4. Overall Rejection %
        const totalInput = batches.reduce((sum, b) => sum + b.inputKg, 0);
        const totalRejection = batches.reduce((sum, b) => sum + (b.rejectionKg || 0), 0);
        const overallRejectionPercent = totalInput > 0 ? ((totalRejection / totalInput) * 100).toFixed(2) : 0;

        res.json({
            metrics: {
                totalBatchesRunning: batches.length, // Completed in period
                averageYield: avgYield.toFixed(2),
                overallRejectionPercent
            },
            yieldData,
            wastageAnalysis: formattedWastage,
            machineUtilization: formattedMachines
        });
    } catch (err: any) {
        console.error('Error fetching production analytics:', err);
        res.status(500).json({ message: 'Server error fetching production analytics' });
    }
};
