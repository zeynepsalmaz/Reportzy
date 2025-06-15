// Types for the application
export interface Dataset {
  id: string;
  name: string;
  filename: string;
  upload_date: string;
  size: number;
  fileSize: number; // Added for compatibility
  rows: number;
  rowCount: number; // Added for compatibility
  columns: number;
  columnCount: number; // Added for compatibility
  status: 'processing' | 'ready' | 'error' | 'completed';
  file_path?: string;
}

export interface AnalyticsSummary {
  success: boolean;
  summary?: {
    available_tables?: string[];
    suggested_queries?: string[];
    data_stats?: {
      total_records?: number;
      total_tables?: number;
      queries_today?: number;
      ai_insights?: number;
      sample_table?: string;
      sample_table_rows?: number;
    };
  };
}

export interface AIQuery {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  sql_query?: string;
  execution_time?: number;
}

export interface APIConnection {
  id: string;
  name: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync?: string;
  headers?: Record<string, string>;
}

export interface DashboardStats {
  totalRecords: number;
  activeTables: number;
  queriesToday: number;
  aiInsights: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  isActive?: boolean;
}

// AI Response types
export interface AIResponse {
  answer?: string;
  message?: string;
  sql_query?: string;
  execution_time?: number;
  results?: Record<string, unknown>[];
  chart_data?: Record<string, unknown>;
  success?: boolean;
  error_message?: string;
}

export interface AutoInsight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'anomaly' | 'summary' | 'recommendation';
  value?: string | number;
  change?: number;
  timestamp: string;
  category?: string;
  confidence?: number;
}

export interface QueryResult {
  id: string;
  query: string;
  result: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  sql_query?: string;
  timestamp: string;
  success: boolean;
  error?: string;
  execution_time?: number;
}
