export interface PreviewRow {
  row: number;
  period: string;
  dimensionCode: string;
  dimensionName: string;
  targetValue: number | null;
  errors: string[];
}

export interface ImportPreviewResult {
  status: 'Preview';
  totalRows: number;
  rows: PreviewRow[];
  hasErrors: boolean;
}

export interface RowError {
  row: number;
  errors: string[];
}

export interface ImportRunResult {
  status: 'Success' | 'Failed';
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: RowError[];
}
