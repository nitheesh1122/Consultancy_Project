import { Request, Response } from 'express';
import ReportRecipient from '../models/ReportRecipient';
import ReportConfig from '../models/ReportConfig';
import { getDailyActivitySummary } from '../services/reportDataService';
import { generateCSVReport, generatePDFReport } from '../services/reportFileService';
import { sendReportEmail } from '../services/emailService';
import { AuditLog } from '../models/AuditLog';

// --- Recipients CRUD ---
export const getRecipients = async (req: Request, res: Response) => {
    try {
        const recipients = await ReportRecipient.find();
        res.json(recipients);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching recipients', error: error.message });
    }
};

export const addRecipient = async (req: Request, res: Response) => {
    try {
        const { email, name, isActive } = req.body;
        const exists = await ReportRecipient.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already exists' });

        const recipient = await ReportRecipient.create({ email, name, isActive });
        res.status(201).json(recipient);
    } catch (error: any) {
        res.status(500).json({ message: 'Error adding recipient', error: error.message });
    }
};

export const updateRecipient = async (req: Request, res: Response) => {
    try {
        const { email, name, isActive } = req.body;
        const recipient = await ReportRecipient.findByIdAndUpdate(
            req.params.id,
            { email, name, isActive },
            { new: true }
        );
        if (!recipient) return res.status(404).json({ message: 'Recipient not found' });
        res.json(recipient);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating recipient', error: error.message });
    }
};

export const deleteRecipient = async (req: Request, res: Response) => {
    try {
        const recipient = await ReportRecipient.findByIdAndDelete(req.params.id);
        if (!recipient) return res.status(404).json({ message: 'Recipient not found' });
        res.json({ message: 'Recipient removed' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting recipient', error: error.message });
    }
};

// --- Config CRUD ---
export const getConfig = async (req: Request, res: Response) => {
    try {
        let config = await ReportConfig.findOne();
        if (!config) {
            config = await ReportConfig.create({ isDailyReportEnabled: true, dailyReportSchedule: '0 8 * * *' });
        }
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching config', error: error.message });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const { isDailyReportEnabled, dailyReportSchedule } = req.body;
        let config = await ReportConfig.findOne();
        if (config) {
            config.isDailyReportEnabled = isDailyReportEnabled;
            config.dailyReportSchedule = dailyReportSchedule;
            await config.save();
        } else {
            config = await ReportConfig.create({ isDailyReportEnabled, dailyReportSchedule });
        }
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating config', error: error.message });
    }
};

// --- Report Generation & Sending ---
export const generateReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, format } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required' });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        // Ensure end encompasses the whole day if short strings were passed
        if (startDate === endDate) {
            end.setHours(23, 59, 59, 999);
        }

        const data = await getDailyActivitySummary(start, end);

        if (format === 'csv') {
            const csvBuffer = generateCSVReport(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=Report_${start.toISOString().split('T')[0]}.csv`);
            return res.send(csvBuffer);
        } else {
            const pdfBuffer = await generatePDFReport(data);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Report_${start.toISOString().split('T')[0]}.pdf`);
            return res.send(pdfBuffer);
        }
    } catch (error: any) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
};

export const sendReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, format, emails } = req.body;

        if (!startDate || !endDate || !emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ message: 'startDate, endDate, and emails array are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (startDate === endDate) {
            end.setHours(23, 59, 59, 999);
        }

        const data = await getDailyActivitySummary(start, end);
        let attachment;
        const filename = `SystemReport_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;

        if (format === 'csv') {
            const csvStr = generateCSVReport(data);
            attachment = { filename: `${filename}.csv`, content: csvStr };
        } else {
            const pdfBuffer = await generatePDFReport(data);
            attachment = { filename: `${filename}.pdf`, content: pdfBuffer };
        }

        const subject = `System Operations Report (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
        const text = `Please find attached the requested system operations report in ${format.toUpperCase()} format.`;

        await sendReportEmail(emails, subject, text, [attachment]);

        await AuditLog.create({
            action: 'MANUAL_REPORT_SENT',
            details: { format, recipients: emails, dateRange: { start, end } },
            userId: (req as any).user?._id
        });

        res.json({ message: 'Report sent successfully' });
    } catch (error: any) {
        console.error("Error sending manual report:", error);
        res.status(500).json({ message: 'Error sending manual report', error: error.message });
    }
};
