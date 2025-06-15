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

  // Dataset API
  async getDatasets() {
    return this.request(API_CONFIG.ENDPOINTS.DATASETS);
  }

  async uploadDataset(formData: FormData) {
    return fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  }

  async deleteDataset(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.DELETE_DATASET}/${id}`, {
      method: 'DELETE',
    });
  }

  async previewDataset(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PREVIEW_DATASET}/${id}`);
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

  // API Connection
  async connectAPI(config: Record<string, unknown>) {
    return this.request(API_CONFIG.ENDPOINTS.CONNECT_API, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }
}

export const apiClient = new ApiClient();
