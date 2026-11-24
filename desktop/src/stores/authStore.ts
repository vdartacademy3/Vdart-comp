import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

export interface EmployeeUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  department: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  employee: EmployeeUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (loginStr: string, password: string) => Promise<boolean>;
  register: (data: { email: string; username: string; full_name: string; password: string; department?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  employee: null,
  token: localStorage.getItem('vcamp_auth_token'),
  isLoading: false,
  error: null,

  login: async (loginStr, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/login', { login: loginStr, password });
      apiClient.setToken(data.access_token);
      const user: EmployeeUser = {
        id: data.employee_id,
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        department: data.department,
      };
      set({
        isAuthenticated: true,
        employee: user,
        token: data.access_token,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      return false;
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/register', registerData);
      apiClient.setToken(data.access_token);
      const user: EmployeeUser = {
        id: data.employee_id,
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        department: data.department,
      };
      set({
        isAuthenticated: true,
        employee: user,
        token: data.access_token,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    apiClient.setToken(null);
    set({
      isAuthenticated: false,
      employee: null,
      token: null,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = apiClient.getToken();
    if (!token) {
      set({ isAuthenticated: false, employee: null });
      return false;
    }

    try {
      const user = await apiClient.get<EmployeeUser>('/auth/me');
      set({
        isAuthenticated: true,
        employee: user,
        token,
      });
      return true;
    } catch {
      apiClient.setToken(null);
      set({
        isAuthenticated: false,
        employee: null,
        token: null,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
