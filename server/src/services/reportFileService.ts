import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

// ─── Company Constants ─────────────────────────────────────────────────────────
const CO = {
    name: 'GOLDEN TEXTILE DYERS',
    addr1: '206 / 1, Gangapuram,',
    addr2: 'ERODE – 638 102.',
    gstin: 'GSTIN : 33AALFG7407L1Z6',
    phone: '0424 - 2534457',
    fax: '0424 - 2534458',
};

const NAVY = '#1e1e64';
const NAVY_RGB = { r: 30, g: 30, b: 100 };
const LIGHT_NAVY = '#ebebf8';
const GRAY = '#666666';

// ─── Page Border ──────────────────────────────────────────────────────────────
function drawPageBorder(doc: PDFKit.PDFDocument) {
    const W = doc.page.width;
    const H = doc.page.height;
    doc.save();
    doc.rect(6, 6, W - 12, H - 12).strokeColor(NAVY).lineWidth(0.8).stroke();
    doc.rect(9, 9, W - 18, H - 18).strokeColor('#d0d0e0').lineWidth(0.3).stroke();
    doc.restore();
}

// ─── Letterhead ───────────────────────────────────────────────────────────────
function drawLetterhead(doc: PDFKit.PDFDocument): number {
    const W = doc.page.width;
    const L = 40;
    const R = W - 40;

    drawPageBorder(doc);

    // GSTIN (left) | Phone/Fax (right)
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY);
    doc.text(CO.gstin, L, 32);
    doc.text(CO.phone, 0, 32, { width: R, align: 'right' });
    doc.font('Helvetica').text(`Fax : ${CO.fax}`, 0, 42, { width: R, align: 'right' });

    // Company name (centred, large)
    doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY);
    doc.text(CO.name, L, 36, { width: R - L, align: 'center' });

    // Address
    doc.font('Helvetica').fontSize(10).fillColor(NAVY);
    doc.text(CO.addr1, L, 60, { width: R - L, align: 'center' });
    doc.text(CO.addr2, L, 72, { width: R - L, align: 'center' });

    // Horizontal rule
    const ruleY = 88;
    doc.moveTo(L, ruleY).lineTo(R, ruleY).strokeColor(NAVY).lineWidth(1).stroke();

    doc.fillColor('#000000');
    return ruleY + 14;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawFooter(doc: PDFKit.PDFDocument, page: number, total: number) {
    const W = doc.page.width;
    const H = doc.page.height;
    const L = 40;
    const R = W - 40;
    const fy = H - 30;

    doc.moveTo(L, fy - 6).lineTo(R, fy - 6).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(GRAY);
    doc.text(
        'Golden Textile Dyers – Inventory & Procurement ERP  |  System-Generated Document',
        L, fy, { width: R - L, align: 'center' }
    );
    doc.text(`Page ${page} of ${total}`, L, fy, { width: R - L, align: 'right' });
    doc.fillColor('#000000');
}

// ─── Section Header ───────────────────────────────────────────────────────────
function drawSectionHeader(doc: PDFKit.PDFDocument, text: string, y: number): number {
    const W = doc.page.width;
    const L = 40;
    const R = W - 40;
    doc.rect(L, y, R - L, 18).fill(NAVY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
    doc.text(text, L + 8, y + 4);
    doc.fillColor('#000000');
    return y + 24;
}

// ─── Metric Card Grid ─────────────────────────────────────────────────────────
/**
 * Draws 2-column metric cards. Returns Y after the grid.
 */
function drawMetricCards(
    doc: PDFKit.PDFDocument,
    metrics: { label: string; value: string | number }[],
    startY: number
): number {
    const W = doc.page.width;
    const L = 40;
    const R = W - 40;
    const cardW = (R - L - 10) / 2;
    const cardH = 40;
    const rowsNeeded = Math.ceil(metrics.length / 2);

    for (let i = 0; i < metrics.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = L + col * (cardW + 10);
        const y = startY + row * (cardH + 8);

        // Card background
        doc.rect(x, y, cardW, cardH).fill(LIGHT_NAVY).stroke();

        // Left accent bar
        doc.rect(x, y, 4, cardH).fill(NAVY);

        // Value (large, navy)
        doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY);
        doc.text(String(metrics[i].value), x + 12, y + 6, { width: cardW - 16 });

        // Label (smaller, grey)
        doc.font('Helvetica').fontSize(8).fillColor(GRAY);
        doc.text(metrics[i].label, x + 12, y + 27, { width: cardW - 16 });

        doc.fillColor('#000000');
    }

    return startY + rowsNeeded * (cardH + 8) + 8;
}

// ─── Two-column table rows ─────────────────────────────────────────────────────
function drawTableRows(
    doc: PDFKit.PDFDocument,
    rows: { label: string; value: string | number }[],
    startY: number
): number {
    const W = doc.page.width;
    const L = 40;
    const R = W - 40;
    const rowH = 18;

    rows.forEach((row, i) => {
        const y = startY + i * rowH;
        const bg = i % 2 === 0 ? LIGHT_NAVY : '#ffffff';
        doc.rect(L, y, R - L, rowH).fill(bg);
        doc.font('Helvetica').fontSize(9.5).fillColor('#222222');
        doc.text(row.label, L + 8, y + 4);
        doc.font('Helvetica-Bold').fillColor(NAVY);
        doc.text(String(row.value), L, y + 4, { width: R - L - 8, align: 'right' });
        doc.fillColor('#000000');
    });

    return startY + rows.length * rowH + 10;
}

// ─── Filename Builder ──────────────────────────────────────────────────────────
export function buildReportFileName(reportType: string, startDate: Date, endDate: Date, ext: 'pdf' | 'csv'): string {
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const slug = reportType.replace(/\s+/g, '-');
    if (fmt(startDate) === fmt(endDate)) {
        return `GTD_${slug}_${fmt(startDate)}.${ext}`;
    }
    return `GTD_${slug}_${fmt(startDate)}_to_${fmt(endDate)}.${ext}`;
}

// ─── PDF Report Generator ──────────────────────────────────────────────────────
export const generatePDFReport = async (data: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 40, size: 'A4',
                bufferPages: true,  // needed to re-draw footer on all pages
            });
            const buffers: Buffer[] = [];
            doc.on('data', (c) => buffers.push(c));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const W = doc.page.width;
            const L = 40;
            const R = W - 40;

            // ── Letterhead ────────────────────────────────────────────────
            let y = drawLetterhead(doc);

            // Date (right-aligned, below rule)
            const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.font('Helvetica').fontSize(9).fillColor(GRAY);
            doc.text(`Date : ${dateStr}`, L, y - 6, { width: R - L, align: 'right' });
            doc.fillColor('#000000');

            // ── Title ─────────────────────────────────────────────────────
            doc.font('Helvetica-Bold').fontSize(15).fillColor(NAVY);
            doc.text('SYSTEM OPERATIONS REPORT', L, y + 2, { width: R - L, align: 'center' });
            doc.fillColor('#000000');
            y += 22;

            // ── Period & generation info ──────────────────────────────────
            const periodStart = new Date(data.dateRange.start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const periodEnd = new Date(data.dateRange.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const generatedAt = new Date(data.reportGeneratedAt).toLocaleString('en-IN');

            // Info box
            doc.rect(L, y, R - L, 28).fill(LIGHT_NAVY);
            doc.rect(L, y, 4, 28).fill(NAVY);
            doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY);
            doc.text('Report Period :', L + 10, y + 5);
            doc.font('Helvetica').fillColor('#222222');
            doc.text(`${periodStart}  to  ${periodEnd}`, L + 90, y + 5);
            doc.font('Helvetica-Bold').fillColor(NAVY);
            doc.text('Generated On :', L + 10, y + 17);
            doc.font('Helvetica').fillColor('#222222');
            doc.text(generatedAt, L + 90, y + 17);
            doc.fillColor('#000000');
            y += 38;

            // ── Section: Key Metrics (Boxed cards) ────────────────────────
            y = drawSectionHeader(doc, 'KEY METRICS SUMMARY', y);

            const m = data.metrics;
            const metricCards = [
                { label: 'Batches Processed', value: m.totalBatchesProcessed },
                { label: 'Material Requests Created', value: m.totalMaterialRequestsCreated },
                { label: 'Material Requests Resolved', value: m.totalMaterialRequestsResolved },
                { label: 'Inventory Transactions', value: m.totalInventoryChanges },
                { label: 'User Logins', value: m.totalLogins ?? m.totalActiveUsersLoggedIn },
                { label: 'Unique Active Users', value: m.totalActiveUsersLoggedIn },
                { label: 'Total System Actions', value: m.totalAuditActions },
                { label: 'System Errors / Failures', value: m.totalSystemErrors },
            ];
            y = drawMetricCards(doc, metricCards, y);
            y += 8;

            // ── Section: Audit Insights ───────────────────────────────────
            if (data.auditInsights) {
                const ai = data.auditInsights;

                if (ai.actionsByModule && Object.keys(ai.actionsByModule).length) {
                    y = drawSectionHeader(doc, 'ACTIVITY BY MODULE', y);
                    const modRows = Object.entries(ai.actionsByModule).map(([mod, count]) => ({
                        label: mod,
                        value: `${count} actions`,
                    }));
                    y = drawTableRows(doc, modRows, y);
                    y += 8;
                }

                if (ai.topActions && ai.topActions.length) {
                    y = drawSectionHeader(doc, 'MOST COMMON ACTIONS', y);
                    const actionRows = ai.topActions.map((item: any, i: number) => ({
                        label: `#${i + 1}  ${item.action.replace(/_/g, ' ')}`,
                        value: `${item.count}×`,
                    }));
                    y = drawTableRows(doc, actionRows, y);
                    y += 8;
                }

                if (ai.mostActiveUsers && ai.mostActiveUsers.length) {
                    y = drawSectionHeader(doc, 'MOST ACTIVE USERS', y);
                    const userRows = ai.mostActiveUsers.map((item: any, i: number) => ({
                        label: `#${i + 1}  ${item.username}`,
                        value: `${item.count} actions`,
                    }));
                    drawTableRows(doc, userRows, y);
                }
            }

            // ── Footer on all pages ───────────────────────────────────────
            const range = doc.bufferedPageRange();
            const totalPages = range.count;
            for (let i = 0; i < totalPages; i++) {
                doc.switchToPage(range.start + i);
                drawPageBorder(doc);
                drawFooter(doc, i + 1, totalPages);
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

// ─── CSV Report Generator ──────────────────────────────────────────────────────
export const generateCSVReport = (data: any): string => {
    const m = data.metrics;
    const ai = data.auditInsights;

    const rows: { Section: string; Metric: string; Value: any }[] = [
        { Section: 'Report Info', Metric: 'Generated At', Value: new Date(data.reportGeneratedAt).toLocaleString() },
        { Section: 'Report Info', Metric: 'Period Start', Value: new Date(data.dateRange.start).toLocaleString() },
        { Section: 'Report Info', Metric: 'Period End', Value: new Date(data.dateRange.end).toLocaleString() },
        { Section: 'Operations', Metric: 'Batches Processed', Value: m.totalBatchesProcessed },
        { Section: 'Operations', Metric: 'Material Requests Created', Value: m.totalMaterialRequestsCreated },
        { Section: 'Operations', Metric: 'Material Requests Resolved', Value: m.totalMaterialRequestsResolved },
        { Section: 'Operations', Metric: 'Inventory Transactions', Value: m.totalInventoryChanges },
        { Section: 'Activity', Metric: 'Total Logins', Value: m.totalLogins ?? m.totalActiveUsersLoggedIn },
        { Section: 'Activity', Metric: 'Unique Active Users', Value: m.totalActiveUsersLoggedIn },
        { Section: 'Activity', Metric: 'Total Audit Actions', Value: m.totalAuditActions },
        { Section: 'Activity', Metric: 'System Errors', Value: m.totalSystemErrors },
    ];

    if (ai?.actionsByModule) {
        Object.entries(ai.actionsByModule).forEach(([mod, count]) => {
            rows.push({ Section: 'By Module', Metric: mod, Value: count });
        });
    }
    if (ai?.topActions) {
        ai.topActions.forEach((item: any, i: number) => {
            rows.push({ Section: 'Top Actions', Metric: `#${i + 1} ${item.action}`, Value: `${item.count} times` });
        });
    }
    if (ai?.mostActiveUsers) {
        ai.mostActiveUsers.forEach((item: any, i: number) => {
            rows.push({ Section: 'Active Users', Metric: `#${i + 1} ${item.username}`, Value: `${item.count} actions` });
        });
    }

    const parser = new Parser({ fields: ['Section', 'Metric', 'Value'] });
    return parser.parse(rows);
};
