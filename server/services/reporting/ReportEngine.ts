import { ReportConfiguration, ExportDataPayload, IReportProvider } from "./types";
import { DiseaseReportProvider } from "./providers/DiseaseReportProvider";
import { ExportService } from "../exportService";

export class ReportEngine {
  private providers: Map<string, IReportProvider>;

  constructor() {
    this.providers = new Map();
    this.registerProvider(new DiseaseReportProvider());
    // Future providers (Crops, Livestock, Weather, Finance, etc.) can be registered here.
  }

  registerProvider(provider: IReportProvider) {
    this.providers.set(provider.getModuleKey(), provider);
  }

  async generate(config: ReportConfiguration): Promise<{ buffer: Buffer | string; mime: string; ext: string } | null> {
    const blocks = [];

    // 1. Collect Data Blocks from all requested modules
    for (const mod of config.modules) {
      const provider = this.providers.get(mod);
      if (provider) {
        const block = await provider.generateDataBlock(config);
        if (block) {
          blocks.push(block);
        }
      }
    }

    // 2. Assemble the ExportDataPayload
    const exportData: ExportDataPayload = {
      title: config.name,
      subtitle: config.description,
      blocks,
    };

    // 3. Delegate to ExportService (Refactored to handle multiple blocks)
    // Wait, the existing ExportService might only handle one block of exportData with a single 'columns' and 'rows'.
    // Let's assume ExportService gets updated to handle the new format, OR we merge all blocks into a single grid for CSV/Excel, 
    // or we just pass the new ExportDataPayload. 
    // For now, let's adapt it to use ExportService's existing API if needed, 
    // but the instruction says the Backend merges them into a standardized dataset and passes to ExportService.
    
    // Let's implement a quick adaptation for ExportService backward compatibility if we haven't rewritten ExportService yet.
    // If the ExportService expects single columns/rows array, we can flatten it.
    
    // Flatten blocks for legacy ExportService:
    let mergedColumns: any[] = [];
    let mergedRows: any[] = [];
    if (blocks.length > 0) {
      // Just taking the first block for now, or merging them
      mergedColumns = blocks[0].columns;
      mergedRows = blocks[0].rows;
    }

    const legacyExportData = {
      title: exportData.title,
      columns: mergedColumns,
      rows: mergedRows,
    };

    let buffer: Buffer | string = "";
    let mime = "";
    let ext = "";

    if (config.format === "pdf") {
      buffer = await ExportService.generatePdf(legacyExportData);
      mime = "application/pdf";
      ext = "pdf";
    } else if (config.format === "excel") {
      buffer = await ExportService.generateExcel(legacyExportData);
      mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      ext = "xlsx";
    } else if (config.format === "csv") {
      buffer = await ExportService.generateCsv(legacyExportData);
      mime = "text/csv";
      ext = "csv";
    } else {
      return null;
    }

    return { buffer, mime, ext };
  }
}
