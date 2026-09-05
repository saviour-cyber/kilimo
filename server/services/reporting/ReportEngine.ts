import { ReportConfiguration, ExportDataPayload, IReportProvider } from "./types";
import { DiseaseReportProvider } from "./providers/DiseaseReportProvider";
import { CropsReportProvider } from "./providers/CropsReportProvider";
import { LivestockReportProvider } from "./providers/LivestockReportProvider";
import { InventoryReportProvider } from "./providers/InventoryReportProvider";
import { FinanceReportProvider } from "./providers/FinanceReportProvider";
import { WorkersReportProvider } from "./providers/WorkersReportProvider";
import { TasksReportProvider } from "./providers/TasksReportProvider";
import { AnimalAiReportProvider } from "./providers/AnimalAiReportProvider";
import { ExportService } from "../exportService";

export class ReportEngine {
  private providers: Map<string, IReportProvider>;

  constructor() {
    this.providers = new Map();
    this.registerProvider(new DiseaseReportProvider());
    this.registerProvider(new CropsReportProvider());
    this.registerProvider(new LivestockReportProvider());
    this.registerProvider(new AnimalAiReportProvider());
    this.registerProvider(new InventoryReportProvider());
    this.registerProvider(new FinanceReportProvider());
    this.registerProvider(new WorkersReportProvider());
    this.registerProvider(new TasksReportProvider());
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

    if (blocks.length === 0) {
      // No data found — return an empty-but-valid report
      blocks.push({
        title: "No Data Found",
        columns: [{ header: "Message", key: "msg", width: 60 }],
        rows: [{ msg: "No records were found for the selected module and date range." }],
      });
    }

    // 2. Flatten blocks into legacy ExportService format
    const mergedColumns = blocks[0].columns;
    const mergedRows = blocks[0].rows;

    const legacyExportData = {
      title: config.name,
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
