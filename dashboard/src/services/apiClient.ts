const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000/api';

class DashboardApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('vcamp_dashboard_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('vcamp_dashboard_token', token);
    } else {
      localStorage.removeItem('vcamp_dashboard_token');
    }
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('vcamp_dashboard_token');
    }
    return this.token;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.dispatchEvent(new CustomEvent('vcamp:dashboard-unauthorized'));
    }

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return response.json();
  }

  public get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T = any>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public put<T = any>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  public async uploadFile(endpoint: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }

    return response.json();
  }
}

export const apiClient = new DashboardApiClient();
