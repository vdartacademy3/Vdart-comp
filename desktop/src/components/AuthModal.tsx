import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../services/apiClient';
import {
  ArrowRight,
  Building,
  KeyRound,
  Laptop,
  Loader2,
  Mail,
  Minimize2,
  Power,
  Server,
  ShieldCheck,
  User,
} from 'lucide-react';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login, register, startLocalSession, isLoading, error, clearError } = useAuthStore();
  const isTauri =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
  const [mode, setMode] = useState<'local' | 'enterprise'>('local');
  const [isRegister, setIsRegister] = useState(false);

  // Local workspace form
  const [localName, setLocalName] = useState('');
  const [localDepartment, setLocalDepartment] = useState('Engineering');

  // Enterprise server form (no pre-filled passwords)
  const [serverUrl, setServerUrl] = useState(apiClient.getBaseUrl());
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('Engineering');

  const handleLocalStart = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    startLocalSession({
      full_name: localName || 'Desktop User',
      department: localDepartment || 'General',
    });
    onSuccess?.();
  };

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    apiClient.setBaseUrl(serverUrl);

    if (isRegister) {
      if (!loginIdentifier || !password || !fullName || !username) return;
      const ok = await register({
        email: loginIdentifier,
        username,
        full_name: fullName,
        password,
        department,
      });
      if (ok) onSuccess?.();
    } else {
      if (!loginIdentifier || !password) return;
      const ok = await login(loginIdentifier, password);
      if (ok) onSuccess?.();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 ${
        isTauri ? 'bg-transparent' : 'bg-slate-900/25 backdrop-blur-sm p-4'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] max-h-[calc(100vh-16px)] overflow-y-auto bg-white border border-vcamp-border rounded-2xl p-5 shadow-corporate text-vcamp-text space-y-4"
      >
        {/* Corporate Header (draggable in Tauri desktop mode) */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between gap-3 cursor-move select-none"
          title="Drag to move window"
        >
          <div data-tauri-drag-region className="flex items-center gap-3 pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-vcamp-primary text-white font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
              V
            </div>
            <div>
              <h2 className="text-base font-bold text-vcamp-text leading-tight">
                VDart Companion (VCamp)
              </h2>
              <p className="text-xs text-vcamp-muted">
                Desktop AI Companion &amp; Wellbeing Workspace
              </p>
            </div>
          </div>

          {isTauri && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
                    await getCurrentWebviewWindow().hide();
                  } catch {}
                }}
                className="p-1.5 rounded-lg text-vcamp-muted hover:text-vcamp-text hover:bg-slate-100 transition-colors"
                title="Minimize to Tray"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { invoke } = await import('@tauri-apps/api/core');
                    await invoke('exit_vcamp');
                  } catch {}
                }}
                className="p-1.5 rounded-lg text-vcamp-muted hover:text-vcamp-error hover:bg-red-50 transition-colors"
                title="Exit VCamp"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mode Toggle: Standalone Local vs Enterprise Server */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-vcamp-border text-xs">
          <button
            type="button"
            data-testid="auth-mode-local"
            onClick={() => {
              setMode('local');
              clearError();
            }}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'local'
                ? 'bg-white text-vcamp-primary shadow-sm border border-vcamp-border'
                : 'text-vcamp-muted hover:text-vcamp-text'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Local Desktop</span>
          </button>
          <button
            type="button"
            data-testid="auth-mode-enterprise"
            onClick={() => {
              setMode('enterprise');
              clearError();
            }}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'enterprise'
                ? 'bg-white text-vcamp-primary shadow-sm border border-vcamp-border'
                : 'text-vcamp-muted hover:text-vcamp-text'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Enterprise Server</span>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-vcamp-error text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-vcamp-error shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {mode === 'local' ? (
          <form onSubmit={handleLocalStart} className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-vcamp-secondary border border-blue-200 text-vcamp-text leading-relaxed">
              Runs locally on your Windows desktop with private on-device storage, 3D character engine, and configurable AI providers—no server required.
            </div>

            <div>
              <label className="block text-vcamp-text font-semibold mb-1">Your Name</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-vcamp-border rounded-xl focus-within:border-vcamp-primary">
                <User className="w-3.5 h-3.5 text-vcamp-primary shrink-0" />
                <input
                  type="text"
                  required
                  data-testid="local-name-input"
                  placeholder="Enter your name"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="w-full bg-transparent text-vcamp-text outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-vcamp-text font-semibold mb-1">Department / Team</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-vcamp-border rounded-xl focus-within:border-vcamp-primary">
                <Building className="w-3.5 h-3.5 text-vcamp-primary shrink-0" />
                <input
                  type="text"
                  placeholder="Engineering"
                  value={localDepartment}
                  onChange={(e) => setLocalDepartment(e.target.value)}
                  className="w-full bg-transparent text-vcamp-text outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="local-launch-btn"
              className="w-full py-2.5 px-4 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Launch VCamp Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleEnterpriseSubmit} className="space-y-3 text-xs">
            <div className="flex p-1 bg-slate-100 rounded-xl border border-vcamp-border">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  clearError();
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold ${
                  !isRegister ? 'bg-white text-vcamp-primary shadow-sm' : 'text-vcamp-muted'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  clearError();
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold ${
                  isRegister ? 'bg-white text-vcamp-primary shadow-sm' : 'text-vcamp-muted'
                }`}
              >
                Register Account
              </button>
            </div>

            <div>
              <label className="block text-vcamp-text font-semibold mb-1">Backend API URL</label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-vcamp-border rounded-xl text-vcamp-text outline-none focus:border-vcamp-primary"
              />
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-vcamp-text font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-vcamp-border rounded-xl text-vcamp-text outline-none focus:border-vcamp-primary"
                  />
                </div>
                <div>
                  <label className="block text-vcamp-text font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-vcamp-border rounded-xl text-vcamp-text outline-none focus:border-vcamp-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-vcamp-text font-semibold mb-1">
                {isRegister ? 'Work Email' : 'Email or Username'}
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-vcamp-border rounded-xl focus-within:border-vcamp-primary">
                <Mail className="w-3.5 h-3.5 text-vcamp-primary shrink-0" />
                <input
                  type={isRegister ? 'email' : 'text'}
                  required
                  placeholder={isRegister ? 'name@company.com' : 'email or username'}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-transparent text-vcamp-text outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-vcamp-text font-semibold mb-1">Password</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-vcamp-border rounded-xl focus-within:border-vcamp-primary">
                <KeyRound className="w-3.5 h-3.5 text-vcamp-primary shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-vcamp-text outline-none"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-vcamp-text font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-vcamp-border rounded-xl text-vcamp-text outline-none focus:border-vcamp-primary"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Account & Sign In' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-vcamp-border flex items-center justify-between text-[11px] text-vcamp-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-vcamp-success" />
            Consent-Based &amp; Privacy Isolated
          </span>
          <span className="font-medium text-vcamp-primary">v3.0 Corporate</span>
        </div>
      </div>
    </div>
  );
};
