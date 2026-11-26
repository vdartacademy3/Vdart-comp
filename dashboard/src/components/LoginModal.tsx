import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { ShieldCheck, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password.trim()) return;
    const ok = await login(loginInput.trim(), password);
    if (ok && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border border-vcamp-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-vcamp-secondary border border-blue-200 text-vcamp-primary mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-vcamp-text">VDart Companion Admin Console</h2>
          <p className="text-xs text-vcamp-muted">
            Sign in with your enterprise account to access aggregated workplace insights and configuration.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-vcamp-error text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-vcamp-text mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-vcamp-muted absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  clearError();
                }}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-vcamp-border focus:border-vcamp-primary text-xs text-vcamp-text placeholder-vcamp-muted outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-vcamp-text mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-vcamp-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="Enter your password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-vcamp-border focus:border-vcamp-primary text-xs text-vcamp-text placeholder-vcamp-muted outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
