import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import fs from 'fs';

export const generatePDFReport = async (data: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);

            // Title
            doc.fontSize(20).text('System Operations Report', { align: 'center' });
            doc.moveDown();

            // Date Range
            doc.fontSize(12).text(`Report Generated: ${new Date(data.reportGeneratedAt).toLocaleString()}`);
            doc.text(`Period: ${new Date(data.dateRange.start).toLocaleDateString()} to ${new Date(data.dateRange.end).toLocaleDateString()}`);
            doc.moveDown(2);

            // Metrics Section
            doc.fontSize(16).text('Key Metrics Summary', { underline: true });
            doc.moveDown();

            const m = data.metrics;
            const metricsList = [
                `Total Batches Processed: ${m.totalBatchesProcessed}`,
                `Total Material Requests Created: ${m.totalMaterialRequestsCreated}`,
                `Total Material Requests Resolved: ${m.totalMaterialRequestsResolved}`,
                `Total Inventory Transactions: ${m.totalInventoryChanges}`,
                `Total Active Users Logged In: ${m.totalActiveUsersLoggedIn}`,
                `Total Audit Log Actions: ${m.totalAuditActions}`,
                `Total System Errors/Failures: ${m.totalSystemErrors}`
            ];

            metricsList.forEach(text => {
                doc.fontSize(12).text(`•  ${text}`);
                doc.moveDown(0.5);
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

export const generateCSVReport = (data: any): string => {
    const fields = [
        'Metric',
        'Value'
    ];

    const m = data.metrics;
    const csvData = [
        { Metric: 'Report Generated At', Value: new Date(data.reportGeneratedAt).toLocaleString() },
        { Metric: 'Period Start', Value: new Date(data.dateRange.start).toLocaleString() },
        { Metric: 'Period End', Value: new Date(data.dateRange.end).toLocaleString() },
        { Metric: 'Total Batches Processed', Value: m.totalBatchesProcessed },
        { Metric: 'Total Material Requests Created', Value: m.totalMaterialRequestsCreated },
        { Metric: 'Total Material Requests Resolved', Value: m.totalMaterialRequestsResolved },
        { Metric: 'Total Inventory Transactions', Value: m.totalInventoryChanges },
        { Metric: 'Total Active Users Logged In', Value: m.totalActiveUsersLoggedIn },
        { Metric: 'Total Audit Log Actions', Value: m.totalAuditActions },
        { Metric: 'Total System Errors', Value: m.totalSystemErrors },
    ];

    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(csvData);
};
