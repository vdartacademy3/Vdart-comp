import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Lock, Mail, User, KeyRound, Building, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('employee@vcamp.ai');
  const [password, setPassword] = useState('Employee@12345');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('Engineering');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isRegister) {
      if (!loginIdentifier || !password || !fullName || !username) return;
      const ok = await register({
        email: loginIdentifier,
        username,
        full_name: fullName,
        password,
        department,
      });
      if (ok && onSuccess) onSuccess();
    } else {
      if (!loginIdentifier || !password) return;
      const ok = await login(loginIdentifier, password);
      if (ok && onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-950/80 text-white space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 font-extrabold text-xl shadow-lg shadow-cyan-950/50">
            V
          </div>
          <h2 className="text-base font-bold text-white pt-1">
            {isRegister ? 'Register Employee Account' : 'Employee Authentication'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister 
              ? 'Create your individual profile to unlock your companion' 
              : 'Sign in to access your isolated memory, sentiment & companion'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setIsRegister(false); clearError(); }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              !isRegister ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); clearError(); }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              isRegister ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Full Name</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-cyan-400">
                  <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Username</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-cyan-400">
                  <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. jdoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Department</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-cyan-400">
                  <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Engineering / Sales / Support"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              {isRegister ? 'Work Email' : 'Email or Username'}
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-cyan-400">
              <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <input
                type={isRegister ? "email" : "text"}
                required
                placeholder={isRegister ? "employee@vcamp.ai" : "employee@vcamp.ai or username"}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-transparent text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Password</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-cyan-400">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Register & Unlock' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security Assurance Badge */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Strict Tenant Data Isolation
          </span>
          <span className="text-cyan-400 font-mono">Argon2id Encrypted</span>
        </div>
      </div>
    </div>
  );
};
