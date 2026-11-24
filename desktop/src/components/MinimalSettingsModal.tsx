import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCompanionStore } from '../stores/companionStore';
import { 
  X, 
  User, 
  ExternalLink, 
  LogOut, 
  Volume2, 
  Languages, 
  ShieldCheck, 
  Sliders
} from 'lucide-react';

interface MinimalSettingsModalProps {
  onClose: () => void;
}

export const MinimalSettingsModal: React.FC<MinimalSettingsModalProps> = ({ onClose }) => {
  const { employee, logout } = useAuthStore();
  const { 
    speechRate, 
    setSpeechRate, 
    activeLanguage, 
    setActiveLanguage, 
    autoSpeak, 
    setAutoSpeak 
  } = useCompanionStore();

  const handleOpenWebDashboard = () => {
    const webUrl = 'http://localhost:5173';
    window.open(webUrl, '_blank');
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-950/80 text-white space-y-4 text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-xs">
              V
            </div>
            <div>
              <h3 className="font-bold text-white text-xs">Companion Preferences</h3>
              <p className="text-[10px] text-slate-400">Minimal Desktop Settings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Employee Account Card */}
        {employee && (
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                Authenticated Employee
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-medium border border-cyan-500/30">
                {employee.role}
              </span>
            </div>
            <p className="text-xs font-semibold text-white truncate">{employee.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{employee.email} • {employee.department}</p>
          </div>
        )}

        {/* Audio & Speech Minimal Preferences */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              Spoken TTS Audio
            </span>
            <input 
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="accent-cyan-400 w-3.5 h-3.5 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
              <span>Speech Speed Rate</span>
              <span className="font-mono text-cyan-400">{speechRate.toFixed(1)}x</span>
            </div>
            <input 
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Languages className="w-3 h-3 text-cyan-400" />
                Language Mode
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {(['auto', 'ta', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`py-1 rounded-lg border font-medium uppercase transition-colors ${
                    activeLanguage === lang
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'auto' ? 'Auto' : lang === 'ta' ? 'தமிழ்' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Web Dashboard Link Button */}
        <button
          onClick={handleOpenWebDashboard}
          className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Full Web Dashboard</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
