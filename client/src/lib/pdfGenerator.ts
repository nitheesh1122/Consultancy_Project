import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Company Constants ─────────────────────────────────────────────────────────
const COMPANY = {
    name: 'GOLDEN TEXTILE DYERS',
    addressLine1: '206 / 1, Gangapuram,',
    addressLine2: 'ERODE – 638 102.',
    gstin: 'GSTIN : 33AALFG7407L1Z6',
    phone: '0424 - 2534457',
    fax: '0424 - 2534458',
    footer: 'Golden Textile Dyers – Inventory & Procurement ERP  |  System-Generated Document',
};

// Colour palette — matches physical letterhead
const C = {
    navy: [30, 30, 100] as [number, number, number],
    navyHex: '#1e1e64',
    lightNavy: [235, 235, 248] as [number, number, number],
    green: [34, 139, 34] as [number, number, number],
    greenBg: [240, 255, 240] as [number, number, number],
    amber: [180, 100, 0] as [number, number, number],
    amberBg: [255, 248, 230] as [number, number, number],
    red: [180, 30, 30] as [number, number, number],
    redBg: [255, 240, 240] as [number, number, number],
    gray: [100, 100, 100] as [number, number, number],
    lightGray: [247, 247, 250] as [number, number, number],
    border: [210, 210, 220] as [number, number, number],
};

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface PDFTableColumn {
    header: string;
    dataKey: string;
    /** If this key holds a status value, rows will be colour-coded */
    isStatus?: boolean;
}

export interface SignatureField {
    label: string;
    name?: string;
}

export interface PDFGenerationOptions {
    title: string;
    subTitle?: string;
    reportType: string;
    generatedBy: string;
    orientation?: 'portrait' | 'landscape';
    tableData: any[];
    tableColumns: PDFTableColumn[];
    fileName: string;
    metaData?: Record<string, string>;
    summary?: string;
    /** Signature lines rendered at the bottom of the last page */
    signatures?: SignatureField[];
    /** Key in tableData rows that determines row status colour (e.g. 'status') */
    statusKey?: string;
}

// ─── Page border ──────────────────────────────────────────────────────────────
function drawPageBorder(doc: jsPDF) {
    const W = doc.internal.pageSize.width;
    const H = doc.internal.pageSize.height;
    doc.setDrawColor(...C.navy);
    doc.setLineWidth(0.6);
    doc.rect(6, 6, W - 12, H - 12);           // outer frame
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(8, 8, W - 16, H - 16);           // inner subtle frame
    doc.setDrawColor(0);
}

// ─── Letterhead ────────────────────────────────────────────────────────────────
function drawLetterhead(doc: jsPDF): number {
    const W = doc.internal.pageSize.width;
    const L = 14;
    const R = W - 14;
    let y = 14;

    drawPageBorder(doc);

    // ── Row 1: GSTIN left | Phone / Fax right ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text(COMPANY.gstin, L, y);
    doc.text(COMPANY.phone, R, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Fax : ${COMPANY.fax}`, R, y, { align: 'right' });

    // ── Row 2: Company name (centred, large) ──
    y -= 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...C.navy);
    doc.text(COMPANY.name, W / 2, y, { align: 'center' });

    // ── Row 3: Address ──
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(COMPANY.addressLine1, W / 2, y, { align: 'center' });
    y += 5;
    doc.text(COMPANY.addressLine2, W / 2, y, { align: 'center' });

    // ── Horizontal rule ──
    y += 6;
    doc.setDrawColor(...C.navy);
    doc.setLineWidth(0.8);
    doc.line(L, y, R, y);

    doc.setTextColor(0);
    doc.setDrawColor(0);
    return y + 8;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
    const W = doc.internal.pageSize.width;
    const H = doc.internal.pageSize.height;
    const L = 14;
    const R = W - 14;
    const fy = H - 12;

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(L, fy - 4, R, fy - 4);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.gray);
    doc.text(COMPANY.footer, W / 2, fy, { align: 'center' });
    doc.text(`Page ${pageNum} of ${totalPages}`, R, fy, { align: 'right' });

    doc.setTextColor(0);
    doc.setDrawColor(0);
}

// ─── Metadata info-card ───────────────────────────────────────────────────────
/**
 * Draws a neat bordered two-column info card for document metadata.
 * Returns the Y position after the card.
 */
function drawMetaCard(doc: jsPDF, metaData: Record<string, string>, startY: number): number {
    const W = doc.internal.pageSize.width;
    const L = 14;
    const R = W - 14;
    const cardWidth = R - L;
    const entries = Object.entries(metaData);
    const rows = Math.ceil(entries.length / 2);
    const rowH = 10;
    const cardH = rows * rowH + 6;

    // Card background + border
    doc.setFillColor(...C.lightNavy);
    doc.setDrawColor(...C.navy);
    doc.setLineWidth(0.4);
    doc.roundedRect(L, startY, cardWidth, cardH, 2, 2, 'FD');

    // Values
    doc.setFontSize(8.5);
    let y = startY + 7;
    for (let i = 0; i < entries.length; i += 2) {
        const col1X = L + 4;
        const col2X = L + cardWidth / 2 + 4;

        const [k1, v1] = entries[i];
        doc.setFont('helvetica', 'bold').setTextColor(...C.navy);
        doc.text(`${k1}:`, col1X, y);
        doc.setFont('helvetica', 'normal').setTextColor(20, 20, 20);
        doc.text(String(v1), col1X + 32, y);

        if (entries[i + 1]) {
            const [k2, v2] = entries[i + 1];
            doc.setFont('helvetica', 'bold').setTextColor(...C.navy);
            doc.text(`${k2}:`, col2X, y);
            doc.setFont('helvetica', 'normal').setTextColor(20, 20, 20);
            doc.text(String(v2), col2X + 32, y);
        }
        y += rowH;
    }

    doc.setTextColor(0);
    doc.setDrawColor(0);
    doc.setFillColor(255, 255, 255);
    return startY + cardH + 6;
}

// ─── Signature section ────────────────────────────────────────────────────────
function drawSignatures(doc: jsPDF, signatures: SignatureField[], y: number) {
    const W = doc.internal.pageSize.width;
    const L = 14;
    const R = W - 14;
    const usableWidth = R - L;
    const colW = usableWidth / signatures.length;

    // Section label
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...C.navy);
    doc.text('AUTHORIZATION', L, y);
    y += 6;

    // Divider line
    doc.setDrawColor(...C.navy).setLineWidth(0.4);
    doc.line(L, y, R, y);
    y += 20;

    signatures.forEach((sig, i) => {
        const x = L + i * colW;
        const lineEndX = x + colW - 10;
        const lineStartX = x + 4;

        // Signature line
        doc.setDrawColor(...C.border).setLineWidth(0.5);
        doc.line(lineStartX, y, lineEndX, y);

        // Label
        doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...C.navy);
        doc.text(sig.label, x + colW / 2, y + 5, { align: 'center' });

        // Name (if provided)
        if (sig.name) {
            doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...C.gray);
            doc.text(sig.name, x + colW / 2, y + 10, { align: 'center' });
        }
    });

    doc.setTextColor(0);
    doc.setDrawColor(0);
}

// ─── Status → row colour map ──────────────────────────────────────────────────
function getStatusRowStyle(status: string): { textColor: [number, number, number]; fillColor: [number, number, number] } | null {
    const s = String(status).toLowerCase();
    if (s === 'fulfilled' || s === 'issued' || s === 'approved' || s === 'completed') {
        return { textColor: C.green, fillColor: C.greenBg };
    }
    if (s === 'pending' || s === 'in_progress' || s === 'partially') {
        return { textColor: C.amber, fillColor: C.amberBg };
    }
    if (s === 'rejected' || s === 'failed' || s === 'cancelled') {
        return { textColor: C.red, fillColor: C.redBg };
    }
    return null;
}

// ─── Filename builder ─────────────────────────────────────────────────────────
export function buildFileName(docType: string, identifier?: string): string {
    const date = new Date().toISOString().split('T')[0];
    const slug = docType.replace(/\s+/g, '-');
    const parts = ['GTD', slug];
    if (identifier) parts.push(identifier);
    parts.push(date);
    return `${parts.join('_')}.pdf`;
}

// ─── Main generator ───────────────────────────────────────────────────────────
export const generatePDF = (options: PDFGenerationOptions) => {
    const {
        title,
        reportType,
        generatedBy,
        orientation = 'portrait',
        tableData,
        tableColumns,
        fileName,
        metaData,
        signatures,
        statusKey,
    } = options;

    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.width;
    const L = 14;
    const R = W - 14;

    // ── Letterhead ────────────────────────────────────────────────────────────
    let y = drawLetterhead(doc);

    // ── Document meta (date + prepared by, right-aligned) ────────────────────
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...C.gray);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(`Date: ${dateStr}`, R, y - 4, { align: 'right' });
    doc.text(`Prepared by: ${generatedBy}`, R, y + 1, { align: 'right' });
    doc.setTextColor(0);

    // ── Document title ────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(...C.navy);
    doc.text(title.toUpperCase(), W / 2, y + 4, { align: 'center' });
    doc.setTextColor(0);

    y += 14;

    // ── Optional subtitle ─────────────────────────────────────────────────────
    if (options.subTitle) {
        doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...C.gray);
        doc.text(options.subTitle, W / 2, y, { align: 'center' });
        y += 7;
        doc.setTextColor(0);
    }

    // ── Metadata info-card ────────────────────────────────────────────────────
    if (metaData && Object.keys(metaData).length) {
        y = drawMetaCard(doc, metaData, y);
    }

    // ── Summary paragraph ─────────────────────────────────────────────────────
    if (options.summary) {
        doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...C.gray);
        const lines = doc.splitTextToSize(options.summary, R - L);
        doc.text(lines, L, y);
        y += lines.length * 4.5 + 5;
        doc.setTextColor(0);
    }

    // ── Table ─────────────────────────────────────────────────────────────────
    const statusColIndex = statusKey ? tableColumns.findIndex(c => c.dataKey === statusKey) : -1;

    const body = tableData.map(row =>
        tableColumns.map(col => {
            const val = row[col.dataKey];
            return val !== undefined && val !== null ? String(val) : '';
        })
    );

    autoTable(doc, {
        head: [tableColumns.map(col => col.header)],
        body,
        startY: y,
        theme: 'grid',
        headStyles: {
            fillColor: C.navy,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 4,
            lineColor: C.navy,
            lineWidth: 0.1,
        },
        bodyStyles: {
            textColor: [20, 20, 20],
            fontSize: 8.5,
            cellPadding: 3.5,
            lineColor: C.border,
            lineWidth: 0.1,
        },
        alternateRowStyles: {
            fillColor: C.lightGray,
        },
        styles: {
            font: 'helvetica',
            overflow: 'linebreak',
        },
        columnStyles: statusColIndex >= 0 ? {
            [statusColIndex]: { fontStyle: 'bold' }
        } : {},
        margin: { left: L, right: 14, bottom: 24 },
        // Colour-code rows by status
        didParseCell: (hookData) => {
            if (statusColIndex >= 0 && hookData.section === 'body') {
                const statusVal = tableData[hookData.row.index]?.[statusKey!];
                const style = statusVal ? getStatusRowStyle(statusVal) : null;
                if (style) {
                    hookData.cell.styles.textColor = hookData.column.index === statusColIndex
                        ? style.textColor
                        : [20, 20, 20];
                    hookData.cell.styles.fillColor = style.fillColor;
                }
            }
        },
        didDrawPage: (data) => {
            // Redraw border on each new page
            drawPageBorder(doc);
            const total = doc.getNumberOfPages();
            drawFooter(doc, data.pageNumber, total);
        },
    });

    // ── Signature section (last page, before footer) ──────────────────────────
    if (signatures && signatures.length) {
        const finalY = (doc as any).lastAutoTable.finalY ?? y;
        const sigY = finalY + 16;
        const H = doc.internal.pageSize.height;
        // Add new page if not enough space
        if (sigY + 40 > H - 20) {
            doc.addPage();
            drawPageBorder(doc);
        }
        drawSignatures(doc, signatures, sigY > H - 50 ? 30 : sigY);
    }

    // ── Re-draw borders + footers on all pages with correct page count ────────
    const finalTotal = doc.getNumberOfPages();
    for (let i = 1; i <= finalTotal; i++) {
        doc.setPage(i);
        drawPageBorder(doc);
        drawFooter(doc, i, finalTotal);
    }

    doc.save(fileName);
};
