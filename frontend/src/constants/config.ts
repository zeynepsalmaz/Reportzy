// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  ENDPOINTS: {
    // Dashboard
    ANALYTICS_SUMMARY: '/api/analytics-summary',
    
    // Datasets
    DATASETS: '/api/datasets',
    UPLOAD: '/api/upload',
    PREVIEW_DATASET: '/api/preview-dataset',
    DELETE_DATASET: '/api/dataset',
    GENERATE_INSIGHTS: '/api/generate-insights',
    
    // AI
    ASK: '/api/ask',
    
    // API Connections
    CONNECT_API: '/api/connect-api',
  }
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Reportzy',
  DESCRIPTION: 'AI-Powered Data Analytics Platform',
  VERSION: '1.0.0',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_FORMATS: ['.csv', '.xlsx', '.xls'],
} as const;

// Navigation Configuration
export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'BarChart3',
  },
  {
    id: 'import-data',
    label: 'Import Data',
    href: '/import-data',
    icon: 'Upload',
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    href: '/ai-insights',
    icon: 'Brain',
  },
  {
    id: 'api-connect',
    label: 'API Connect',
    href: '/api-connect',
    icon: 'Link',
  },
] as const;
