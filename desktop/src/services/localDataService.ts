import { invoke } from '@tauri-apps/api/core';

const isTauriEnv = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

const STORAGE_PREFIX = 'vcamp_store_';

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export const localDataService = {
  isDesktopRuntime(): boolean {
    return isTauriEnv();
  },

  async getAppDataDir(): Promise<string> {
    if (isTauriEnv()) {
      try {
        return await invoke<string>('get_app_data_dir');
      } catch {}
    }
    return 'Browser LocalStorage';
  },

  async saveItem<T>(key: string, data: T): Promise<void> {
    const cleanKey = sanitizeKey(key);
    const json = JSON.stringify(data);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${cleanKey}`, json);
    } catch {}
    if (isTauriEnv()) {
      try {
        await invoke('save_app_data', { key: cleanKey, payload: json });
      } catch {}
    }
  },

  async loadItem<T>(key: string, fallback: T): Promise<T> {
    const cleanKey = sanitizeKey(key);
    if (isTauriEnv()) {
      try {
        const raw = await invoke<string | null>('load_app_data', { key: cleanKey });
        if (raw) {
          localStorage.setItem(`${STORAGE_PREFIX}${cleanKey}`, raw);
          return JSON.parse(raw) as T;
        }
      } catch {}
    }
    try {
      const local = localStorage.getItem(`${STORAGE_PREFIX}${cleanKey}`);
      if (local) return JSON.parse(local) as T;
    } catch {}
    return fallback;
  },

  async deleteItem(key: string): Promise<void> {
    const cleanKey = sanitizeKey(key);
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${cleanKey}`);
    } catch {}
    if (isTauriEnv()) {
      try {
        await invoke('delete_app_data', { key: cleanKey });
      } catch {}
    }
  },

  async getAutostartEnabled(): Promise<boolean> {
    if (!isTauriEnv()) return false;
    try {
      return await invoke<boolean>('get_autostart_enabled');
    } catch {
      return false;
    }
  },

  async setAutostartEnabled(enabled: boolean): Promise<boolean> {
    if (!isTauriEnv()) return false;
    try {
      return await invoke<boolean>('set_autostart_enabled', { enabled });
    } catch {
      return false;
    }
  },
};
