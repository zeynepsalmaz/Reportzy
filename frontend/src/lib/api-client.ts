import { API_CONFIG } from '@/constants/config';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Dashboard API
  async getAnalyticsSummary() {
    return this.request(API_CONFIG.ENDPOINTS.ANALYTICS_SUMMARY);
  }

  async getDashboardStats() {
    return this.request('/api/dashboard-stats');
  }

  // Dataset API
  async getDatasets() {
    return this.request(API_CONFIG.ENDPOINTS.DATASETS);
  }

  async uploadDataset(formData: FormData) {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.UPLOAD}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload API error:', error);
      throw error;
    }
  }

  async deleteDataset(id: string) {
    return this.request(`/api/dataset/${id}`, {
      method: 'DELETE',
    });
  }

  async getDeletedDatasets() {
    return this.request('/api/deleted-datasets');
  }

  async previewDataset(id: string, limit: number = 10) {
    return this.request(`${API_CONFIG.ENDPOINTS.PREVIEW_DATASET}/${id}/preview?limit=${limit}`);
  }

  async generateInsights(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.GENERATE_INSIGHTS}/${id}`, {
      method: 'POST',
    });
  }

  // AI API
  async askQuestion(question: string) {
    return this.request(API_CONFIG.ENDPOINTS.ASK, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  // API Connections
  async getAPIConnections() {
    return this.request('/api/api-connections');
  }

  async createAPIConnection(config: {
    name: string;
    connection_type: string;
    url: string;
    api_key?: string;
    headers?: Record<string, string>;
    auth_config?: Record<string, any>;
    target_table_name?: string;
    data_mapping?: Record<string, any>;
  }) {
    return this.request('/api/api-connections', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async testAPIConnection(id: number) {
    return this.request(`/api/api-connections/${id}/test`, {
      method: 'POST',
    });
  }

  async syncAPIData(id: number) {
    return this.request(`/api/api-connections/${id}/sync`, {
      method: 'POST',
    });
  }

  async deleteAPIConnection(id: number) {
    return this.request(`/api/api-connections/${id}`, {
      method: 'DELETE',
    });
  }

  async getAPISyncLogs(id: number, limit: number = 10) {
    return this.request(`/api/api-connections/${id}/sync-logs?limit=${limit}`);
  }

  // Legacy API Connection (for backward compatibility)
  async connectAPI(config: Record<string, unknown>) {
    return this.request(API_CONFIG.ENDPOINTS.CONNECT_API, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }
}

export const apiClient = new ApiClient();
