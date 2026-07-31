export interface ReportConfiguration {
  farmId: number;
  name: string;
  description?: string;
  format: "pdf" | "excel" | "csv" | "print";
  dateRange?: {
    from: string; // ISO date
    to: string;   // ISO date
  };
  modules: string[];
  filters?: Record<string, any>;
  grouping?: string;
}

export interface ReportColumnDef {
  header: string;
  key: string;
  width?: number;
}

export interface ReportDataBlock {
  title: string;
  columns: ReportColumnDef[];
  rows: Record<string, any>[];
}

export interface ExportDataPayload {
  title: string;
  subtitle?: string;
  blocks: ReportDataBlock[];
}

export interface IReportProvider {
  /**
   * Unique identifier for the module (e.g., 'disease', 'crops', 'weather')
   */
  getModuleKey(): string;

  /**
   * Fetches and structures the data for this module based on the report configuration.
   */
  generateDataBlock(config: ReportConfiguration): Promise<ReportDataBlock | null>;
}
