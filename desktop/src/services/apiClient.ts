const DEFAULT_BACKEND_URL =
  ((import.meta as any).env?.VITE_BACKEND_URL as string) || 'http://127.0.0.1:8000/api';

const BACKEND_URL_KEY = 'vcamp_backend_url';
const TOKEN_KEY = 'vcamp_auth_token';

class ApiClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  public getBaseUrl(): string {
    try {
      return (localStorage.getItem(BACKEND_URL_KEY) || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
    } catch {
      return DEFAULT_BACKEND_URL;
    }
  }

  public setBaseUrl(url: string): void {
    const clean = (url || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, '');
    try {
      localStorage.setItem(BACKEND_URL_KEY, clean);
    } catch {}
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  }

  public getToken(): string | null {
    if (!this.token) {
      try {
        this.token = localStorage.getItem(TOKEN_KEY);
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  public isLocalSession(): boolean {
    const tok = this.getToken();
    return !tok || tok.startsWith('local_');
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token && !token.startsWith('local_')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.dispatchEvent(new CustomEvent('vcamp:auth-unauthorized'));
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
}

export const apiClient = new ApiClient();
