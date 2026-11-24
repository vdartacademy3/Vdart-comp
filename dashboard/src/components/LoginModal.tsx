import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { ShieldCheck, Lock, User, AlertCircle, Loader2, Sparkles } from 'lucide-react';

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

  const handleQuickFill = (email: string, pass: string) => {
    setLoginInput(email);
    setPassword(pass);
    clearError();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-1 shadow-lg shadow-cyan-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">VCamp Enterprise Portal</h2>
          <p className="text-xs text-slate-400">
            Secure employee authentication with Argon2id encryption & tenant isolation
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  clearError();
                }}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Demo Fast-Login Pill Options */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 mb-2 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Demo Quick Sign-in:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@vcamp.ai', 'Admin@12345')}
              className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-left transition-all"
            >
              <div className="text-[11px] font-semibold text-cyan-300">Super Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@vcamp.ai</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('employee@vcamp.ai', 'Employee@12345')}
              className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-left transition-all"
            >
              <div className="text-[11px] font-semibold text-emerald-300">Employee</div>
              <div className="text-[10px] text-slate-400 truncate">employee@vcamp.ai</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
