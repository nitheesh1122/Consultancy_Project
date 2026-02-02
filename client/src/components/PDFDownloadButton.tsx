import React from 'react';
import { Download } from 'lucide-react';
import { generatePDF, type PDFTableColumn } from '../lib/pdfGenerator';

interface PDFButtonProps {
    type: 'MRS' | 'PI';
    data: any;
    fileName?: string;
}

const PDFDownloadButton: React.FC<PDFButtonProps> = ({ type, data, fileName }) => {
    const handleDownload = () => {
        const isMRS = type === 'MRS';
        const title = isMRS ? 'MATERIAL REQUEST SLIP' : 'PRODUCT INWARD ORDER';
        const reportType = isMRS ? 'Material Request' : 'Inward Order';

        // Prepare Metadata
        const metaData: Record<string, string> = {};
        let generatedBy = 'System';

        if (isMRS) {
            metaData['Batch ID'] = data.batchId || 'N/A';
            metaData['Status'] = data.status || 'N/A';
            metaData['Requested Date'] = new Date(data.createdAt).toLocaleDateString();
            generatedBy = data.supervisorId?.username || 'Supervisor';
        } else {
            metaData['Order ID'] = data._id ? data._id.slice(-6).toUpperCase() : 'N/A';
            metaData['Supplier'] = data.supplierId?.name || 'Unknown Supplier';
            metaData['Status'] = data.status || 'N/A';
            metaData['Raised Date'] = new Date(data.createdAt).toLocaleDateString();
            if (data.reason) metaData['Reason'] = data.reason;
            generatedBy = data.storeManagerId?.username || 'Store Manager';
        }

        // Prepare Table Columns & Data
        let columns: PDFTableColumn[] = [];
        let tableData: any[] = [];

        if (isMRS) {
            columns = [
                { header: 'Material', dataKey: 'material' },
                { header: 'Requested', dataKey: 'requested' },
                { header: 'Issued', dataKey: 'issued' },
                { header: 'Status', dataKey: 'status' }
            ];

            tableData = data.items.map((item: any) => {
                const pending = item.quantityRequested - (item.quantityIssued || 0);
                return {
                    material: item.materialId?.name || 'Unknown',
                    requested: `${item.quantityRequested} ${item.materialId?.unit}`,
                    issued: `${item.quantityIssued || 0} ${item.materialId?.unit}`,
                    status: pending > 0 ? 'Pending' : 'Fulfilled'
                };
            });
        } else {
            columns = [
                { header: 'Material', dataKey: 'material' },
                { header: 'Quantity', dataKey: 'quantity' },
                { header: 'Unit', dataKey: 'unit' }
            ];

            tableData = data.items.map((item: any) => ({
                material: item.materialId?.name || 'Unknown',
                quantity: item.quantity,
                unit: item.materialId?.unit
            }));
        }

        generatePDF({
            title,
            reportType,
            generatedBy,
            fileName: fileName || `${type}_${data._id}.pdf`,
            tableColumns: columns,
            tableData,
            metaData
        });
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center text-indigo-600 hover:text-indigo-800 text-xs font-semibold uppercase tracking-wide"
            title="Download PDF"
        >
            <Download className="w-4 h-4 mr-1" /> PDF
        </button>
    );
};

export default PDFDownloadButton;
