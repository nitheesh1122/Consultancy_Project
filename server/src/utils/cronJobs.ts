import cron from 'node-cron';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import ProductionBatch from '../models/ProductionBatch';
import Settings from '../models/Settings';

// Email Transporter Config
// In a real scenario, this uses ENV variables. Mocking for demonstration if empty.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password'
    }
});

const generatePDF = async (filepath: string, batches: any[]) => {
    return new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(filepath);

        doc.pipe(writeStream);

        doc.fontSize(20).text('Daily Production Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        if (batches.length === 0) {
            doc.text('No batches completed today.');
        } else {
            let totalInput = 0;
            let totalFirstGrade = 0;
            let totalRejection = 0;

            batches.forEach((b, index) => {
                doc.fontSize(14).text(`Batch: ${b.batchNumber}`, { underline: true });
                doc.fontSize(10).text(`Machine: ${(b.machineId as any)?.name || 'Unknown'}`);
                doc.text(`Lot Number: ${b.lotNumber} | Fabric: ${b.fabricType}`);
                doc.text(`Input: ${b.inputKg}kg | 1st Grade Output: ${b.outputFirstGradeKg}kg | Rejection: ${b.rejectionKg}kg`);
                doc.text(`Yield %: ${b.yieldPercentage}% | Wastage %: ${b.wastagePercentage}%`);
                doc.moveDown();

                totalInput += b.inputKg;
                totalFirstGrade += b.outputFirstGradeKg || 0;
                totalRejection += b.rejectionKg || 0;
            });

            doc.addPage();
            doc.fontSize(18).text('Daily Summary', { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(`Total Input Processed: ${totalInput} kg`);
            doc.text(`Total First Grade Output: ${totalFirstGrade} kg`);
            doc.text(`Total Rejection: ${totalRejection} kg`);

            const overallYield = totalInput > 0 ? ((totalFirstGrade / totalInput) * 100).toFixed(2) : 0;
            doc.text(`Overall Daily Yield: ${overallYield}%`);
        }

        doc.end();

        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
    });
};

export const initCronJobs = () => {
    // Run every day at 18:00 (6:00 PM) server time (Assuming IST logic handles offset or server is UTC+5:30)
    // "0 18 * * *"
    // For testing/demonstration purposes safely running once a day, or this can be triggered.
    cron.schedule('0 18 * * *', async () => {
        console.log('Running Daily Production PDF Report Job...');

        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const completedToday = await ProductionBatch.find({
                status: 'COMPLETED',
                endTime: { $gte: todayStart, $lte: todayEnd }
            }).populate('machineId', 'name').lean();

            const reportsDir = path.join(__dirname, '../../reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir);
            }

            const filename = `ProductionReport_${new Date().toISOString().split('T')[0]}.pdf`;
            const filepath = path.join(reportsDir, filename);

            await generatePDF(filepath, completedToday);

            // Fetch Email Recipients from Settings (Or process.env for simplicity here)
            const recipients = process.env.REPORT_EMAILS || 'admin@goldentextile.com';

            const mailOptions = {
                from: '"System Reporter" <no-reply@goldentextile.com>',
                to: recipients,
                subject: `Daily Production Report - ${new Date().toLocaleDateString()}`,
                text: `Please find attached the daily production report for ${new Date().toLocaleDateString()}.\n\nTotal Batches Completed: ${completedToday.length}`,
                attachments: [
                    {
                        filename,
                        path: filepath
                    }
                ]
            };

            await transporter.sendMail(mailOptions);
            console.log(`Report sent successfully to ${recipients}`);

            // Optional: Cleanup old files if necessary, or keep as archive
        } catch (error) {
            console.error('Error generating/sending daily report:', error);
        }
    });

    console.log('Cron jobs initialized.');
};
