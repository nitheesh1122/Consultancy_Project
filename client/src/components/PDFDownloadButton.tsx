import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

interface PDFButtonProps {
    type: 'MRS' | 'PI';
    data: any;
    fileName?: string;
}

const PDFDownloadButton: React.FC<PDFButtonProps> = ({ type, data, fileName }) => {
    const handleDownload = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('Consultancy Inventory System', 14, 22);

        doc.setFontSize(14);
        doc.text(type === 'MRS' ? 'Material Request Slip' : 'Product Inward Order', 14, 32);

        // Meta Data
        doc.setFontSize(10);
        if (type === 'MRS') {
            doc.text(`Batch ID: ${data.batchId}`, 14, 42);
            doc.text(`Requested By: ${data.supervisorId?.username || 'Supervisor'}`, 14, 48);
            doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 14, 54);
            doc.text(`Status: ${data.status}`, 14, 60);
        } else {
            doc.text(`Raised By: ${data.storeManagerId?.username || 'Manager'}`, 14, 42);
            doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 14, 48);
            doc.text(`Status: ${data.status}`, 14, 54);
            doc.text(`Reason: ${data.reason || 'N/A'}`, 14, 60);
        }

        // Table
        const tableColumn = type === 'MRS'
            ? ["Material", "Requested", "Issued", "Status"]
            : ["Material", "Quantity", "Unit"];

        const tableRows = data.items.map((item: any) => {
            if (type === 'MRS') {
                const pending = item.quantityRequested - (item.quantityIssued || 0);
                return [
                    item.materialId?.name || 'Unknown',
                    `${item.quantityRequested} ${item.materialId?.unit}`,
                    `${item.quantityIssued || 0} ${item.materialId?.unit}`,
                    pending > 0 ? 'Pending' : 'Fulfilled'
                ];
            } else {
                return [
                    item.materialId?.name || 'Unknown',
                    item.quantity,
                    item.materialId?.unit
                ];
            }
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
        });

        doc.save(fileName || `${type}_${data._id}.pdf`);
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
