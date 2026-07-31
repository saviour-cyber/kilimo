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
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Title
        doc.fontSize(20).text(data.title, { align: 'center' });
        doc.moveDown(2);

        // Header Row
        doc.fontSize(12).font('Helvetica-Bold');
        let currentX = 50;
        const startY = doc.y;
        
        // Simple equal width columns if not specified
        const colWidth = (doc.page.width - 100) / (data.columns.length || 1);

        data.columns.forEach((col) => {
          const w = col.width || colWidth;
          doc.text(col.header, currentX, startY, { width: w, align: 'left' });
          currentX += w;
        });

        doc.moveDown(0.5);
        
        // Draw line
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
        doc.moveDown(0.5);

        // Data Rows
        doc.font('Helvetica');
        data.rows.forEach((row) => {
          currentX = 50;
          const y = doc.y;
          
          // Check for page break
          if (y > doc.page.height - 100) {
            doc.addPage();
          }

          data.columns.forEach((col) => {
            const w = col.width || colWidth;
            const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : "";
            doc.text(val, currentX, doc.y, { width: w, align: 'left' });
            currentX += w;
          });
          doc.moveDown(0.5);
        });

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
