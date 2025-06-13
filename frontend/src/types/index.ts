export type TabType = "dashboard" | "import-data" | "api-connect" | "ai-insights";

export interface Dataset {
  id: number;
  dataset_name: string;
  table_name: string;
  file_name: string;
  file_size: number;
  row_count: number;
  column_count: number;
  upload_status: string;
  created_at: string;
}

export interface DeletedDataset {
  id: number;
  dataset_name: string;
  table_name: string;
  file_name: string;
  row_count: number;
  column_count: number;
  deleted_at: string;
  deleted_items: Record<string, unknown>;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface QueryResult {
  success: boolean;
  data: Record<string, unknown>[];
  sql_query?: string;
  message?: string;
}

export interface AnalyticsSummary {
  success: boolean;
  summary: {
    data_stats: {
      total_records: number;
      queries_today: number;
      ai_insights: number;
    };
    available_tables: string[];
  };
}
