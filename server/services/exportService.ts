import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';

export interface ReportColumn {
  header: string;
  key: string;
  width?: number; // Approximate width for PDF columns
}

export interface ReportExportData {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, any>[];
}

export class ExportService {
  /**
   * Generate a PDF buffer for the report.
   */
  static async generatePdf(data: ReportExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const pageWidth = doc.page.width;
        const marginLeft = 40;
        const marginRight = 40;
        const usableWidth = pageWidth - marginLeft - marginRight; // ~515pt
        const rowHeight = 18;
        const fontSize = 8;
        const headerFontSize = 9;

        // --- Title ---
        doc.fontSize(16).font('Helvetica-Bold').text(data.title, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#888888').text(
          `Generated: ${new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          { align: 'center' }
        );
        doc.fillColor('#000000').moveDown(1);

        if (data.columns.length === 0) { doc.end(); return; }

        // --- Compute proportional column widths ---
        const totalWeight = data.columns.reduce((sum, col) => sum + (col.width || 20), 0);
        const colWidths = data.columns.map(col => Math.floor(((col.width || 20) / totalWeight) * usableWidth));
        // Fix rounding drift
        const widthSum = colWidths.reduce((a, b) => a + b, 0);
        if (colWidths.length > 0) colWidths[colWidths.length - 1] += usableWidth - widthSum;

        const drawRow = (y: number, values: string[], isHeader: boolean) => {
          // Check page break
          if (y > doc.page.height - 60) {
            doc.addPage();
            y = 40;
          }

          const bgColor = isHeader ? '#1E3F2D' : null;
          const textColor = isHeader ? '#FFFFFF' : '#1a1a1a';
          const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';

          // Background rect for header
          if (bgColor) {
            doc.rect(marginLeft, y, usableWidth, rowHeight).fill(bgColor);
          }

          doc.font(font).fontSize(isHeader ? headerFontSize : fontSize).fillColor(textColor);
          let x = marginLeft;
          values.forEach((val, i) => {
            const w = colWidths[i] ?? 60;
            const safeVal = val != null ? String(val) : "";
            // clip text to column width
            doc.text(safeVal, x + 2, y + (rowHeight - (isHeader ? headerFontSize : fontSize)) / 2, {
              width: w - 4,
              height: rowHeight,
              lineBreak: false,
              ellipsis: true,
            });
            x += w;
          });

          // Row separator line
          if (!isHeader) {
            doc.moveTo(marginLeft, y + rowHeight)
               .lineTo(marginLeft + usableWidth, y + rowHeight)
               .strokeColor('#e5e7eb')
               .lineWidth(0.5)
               .stroke();
          }

          doc.fillColor('#000000');
          return y + rowHeight;
        };

        // --- Header Row ---
        let currentY = doc.y;
        currentY = drawRow(currentY, data.columns.map(c => c.header), true);

        // --- Data Rows ---
        data.rows.forEach((row, idx) => {
          if (currentY > doc.page.height - 60) {
            doc.addPage();
            currentY = 40;
            // Re-draw header on new page
            currentY = drawRow(currentY, data.columns.map(c => c.header), true);
          }
          // Alternating row background
          if (idx % 2 === 1) {
            doc.rect(marginLeft, currentY, usableWidth, rowHeight).fill('#f9fafb');
          }
          const vals = data.columns.map(col => {
            const v = row[col.key];
            return v != null ? String(v) : "";
          });
          currentY = drawRow(currentY, vals, false);
        });

        // Footer
        doc.fontSize(7).fillColor('#aaaaaa').text(
          `KiliSense Platform — Confidential`,
          marginLeft,
          doc.page.height - 30,
          { align: 'center', width: usableWidth }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generate an Excel buffer for the report.
   */
  static async generateExcel(data: ReportExportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Data');

    // Add title
    worksheet.addRow([data.title]);
    if (data.columns.length > 0) {
      worksheet.mergeCells(`A1:${String.fromCharCode(64 + data.columns.length)}1`);
    }
    const titleRow = worksheet.getRow(1);
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.addRow([]);

    // Configure columns
    worksheet.columns = data.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: (col.width && col.width > 20) ? col.width / 5 : 20, // scale down roughly for excel
    }));

    // Style header row
    const headerRow = worksheet.getRow(3);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: {style:'thin'},
        left: {style:'thin'},
        bottom: {style:'thin'},
        right: {style:'thin'}
      };
    });

    // Add rows
    worksheet.addRows(data.rows);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generate a CSV string for the report.
   */
  static async generateCsv(data: ReportExportData): Promise<string> {
    if (data.columns.length === 0) return "";
    const csvStringifier = createObjectCsvStringifier({
      header: data.columns.map(col => ({ id: col.key, title: col.header }))
    });

    const header = csvStringifier.getHeaderString();
    const records = csvStringifier.stringifyRecords(data.rows);
    return header + records;
  }
}
