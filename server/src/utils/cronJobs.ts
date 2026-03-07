import cron from 'node-cron';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import ProductionBatch from '../models/ProductionBatch';
import Worker from '../models/Worker';
import { AuditLog } from '../models/AuditLog';
import ReportConfig from '../models/ReportConfig';
import ReportRecipient from '../models/ReportRecipient';
import { getDailyActivitySummary } from '../services/reportDataService';
import { generatePDFReport } from '../services/reportFileService';
import { sendReportEmail } from '../services/emailService';

export const initCronJobs = () => {

    // ─── 1. AUTOMATED DAILY SYSTEM REPORT ────────────────────────────────
    // Runs at 08:00 AM every day
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Running Automated Daily System Report Job...');

        try {
            const config = await ReportConfig.findOne();
            if (config && !config.isDailyReportEnabled) {
                console.log('[Cron] Daily reports are disabled. Skipping.');
                return;
            }

            const recipientsDocs = await ReportRecipient.find({ isActive: true });
            if (recipientsDocs.length === 0) {
                console.log('[Cron] No active email recipients found. Skipping daily report.');
                return;
            }

            const emails = recipientsDocs.map(r => r.email);

            // Last 24 hours
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

            const data = await getDailyActivitySummary(startDate, endDate);
            const pdfBuffer = await generatePDFReport(data);

            const subject = `Daily System Operations Report - ${endDate.toLocaleDateString()}`;
            const text = `Please find attached the automated daily system operations report covering the last 24 hours.`;
            const filename = `SystemReport_${endDate.toISOString().split('T')[0]}.pdf`;

            await sendReportEmail(emails, subject, text, [
                { filename, content: pdfBuffer }
            ]);

            if (config) {
                config.lastReportSentAt = new Date();
                await config.save();
            }

            console.log(`[Cron] Daily report sent successfully to ${emails.length} recipients.`);

            await AuditLog.create({
                action: 'AUTOMATED_DAILY_REPORT_SENT',
                details: { status: 'SUCCESS', recipients: emails, format: 'pdf', period: { startDate, endDate } }
            });

        } catch (error: any) {
            console.error('[Cron] Error in automated daily system report job:', error);
            await AuditLog.create({
                action: 'AUTOMATED_DAILY_REPORT_SENT',
                details: { status: 'FAILED', error: error.message || 'Unknown error' }
            });
        }
    });

    // ─── 2. ORPHANED WORKER LOCK CLEANUP ─────────────────────────────────
    // Runs every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        try {
            const activeBatches = await ProductionBatch.find({
                status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
                assignedWorkers: { $exists: true, $not: { $size: 0 } }
            }).select('assignedWorkers').lean();

            const legitimatelyBusyWorkerIds = activeBatches.reduce((acc: any[], batch) => {
                if (batch.assignedWorkers) {
                    acc.push(...batch.assignedWorkers);
                }
                return acc;
            }, []);

            const result = await Worker.updateMany(
                {
                    status: 'BUSY',
                    _id: { $nin: legitimatelyBusyWorkerIds }
                },
                { $set: { status: 'ACTIVE' } }
            );

            if (result.modifiedCount > 0) {
                console.log(`[Cron] Orphaned Lock Cleanup: Unlocked ${result.modifiedCount} stuck workers.`);
                await AuditLog.create({
                    action: 'ORPHAN_LOCK_CLEANUP',
                    details: { status: 'SUCCESS', unlockedCount: result.modifiedCount }
                });
            }
        } catch (error: any) {
            console.error('[Cron Error] Failed to cleanup orphaned worker locks:', error);
        }
    });

    console.log('Cron jobs initialized.');
};
