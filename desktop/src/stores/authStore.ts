import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

export interface EmployeeUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  department: string;
  mode?: 'enterprise' | 'local';
}

const LOCAL_USER_KEY = 'vcamp_local_user_session';

interface AuthStore {
  isAuthenticated: boolean;
  employee: EmployeeUser | null;
  token: string | null;
  authMode: 'enterprise' | 'local';
  isLoading: boolean;
  error: string | null;

  login: (loginStr: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    username: string;
    full_name: string;
    password: string;
    department?: string;
  }) => Promise<boolean>;
  startLocalSession: (data: { full_name: string; department?: string; email?: string }) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  employee: null,
  token: apiClient.getToken(),
  authMode: 'local',
  isLoading: false,
  error: null,

  login: async (loginStr, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/login', { login: loginStr, password });
      apiClient.setToken(data.access_token);
      localStorage.removeItem(LOCAL_USER_KEY);
      const user: EmployeeUser = {
        id: data.employee_id,
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        department: data.department,
        mode: 'enterprise',
      };
      set({
        isAuthenticated: true,
        employee: user,
        token: data.access_token,
        authMode: 'enterprise',
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Unable to connect or invalid credentials' });
      return false;
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/register', registerData);
      apiClient.setToken(data.access_token);
      localStorage.removeItem(LOCAL_USER_KEY);
      const user: EmployeeUser = {
        id: data.employee_id,
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        department: data.department,
        mode: 'enterprise',
      };
      set({
        isAuthenticated: true,
        employee: user,
        token: data.access_token,
        authMode: 'enterprise',
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      return false;
    }
  },

  startLocalSession: (data) => {
    const cleanName = data.full_name.trim() || 'Desktop User';
    const user: EmployeeUser = {
      id: 1,
      email: (data.email || 'local@vcamp.desktop').trim(),
      username: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'desktop_user',
      full_name: cleanName,
      role: 'EMPLOYEE',
      department: (data.department || 'General').trim(),
      mode: 'local',
    };
    const localTok = `local_${Date.now()}`;
    apiClient.setToken(localTok);
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } catch {}
    set({
      isAuthenticated: true,
      employee: user,
      token: localTok,
      authMode: 'local',
      isLoading: false,
      error: null,
    });
  },

  logout: async () => {
    const token = apiClient.getToken();
    if (token && !token.startsWith('local_')) {
      try {
        await apiClient.post('/auth/logout');
      } catch {}
    }
    apiClient.setToken(null);
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
    } catch {}
    set({
      isAuthenticated: false,
      employee: null,
      token: null,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = apiClient.getToken();
    if (token && token.startsWith('local_')) {
      try {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (raw) {
          const user = JSON.parse(raw) as EmployeeUser;
          set({ isAuthenticated: true, employee: user, token, authMode: 'local' });
          return true;
        }
      } catch {}
    }

    if (!token || token.startsWith('local_')) {
      set({ isAuthenticated: false, employee: null });
      return false;
    }

    try {
      const user = await apiClient.get<EmployeeUser>('/auth/me');
      set({
        isAuthenticated: true,
        employee: { ...user, mode: 'enterprise' },
        token,
        authMode: 'enterprise',
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
