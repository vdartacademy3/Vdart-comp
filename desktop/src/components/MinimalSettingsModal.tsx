import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCompanionStore } from '../stores/companionStore';
import {
  X,
  User,
  Maximize2,
  LogOut,
  Volume2,
  Languages,
  Users,
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
    setAutoSpeak,
    openCharacterStudio,
    setIsDashboardOpen,
    setActiveDashboardTab,
  } = useCompanionStore();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const isTauri =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 ${
        isTauri ? 'bg-transparent' : 'bg-slate-900/25 backdrop-blur-sm p-3'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs max-h-[calc(100vh-16px)] overflow-y-auto vcamp-card rounded-2xl p-4 text-vcamp-text space-y-4 text-xs"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-vcamp-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-vcamp-primary text-white flex items-center justify-center font-bold text-xs">
              V
            </div>
            <div>
              <h3 className="font-bold text-vcamp-text text-xs">Quick Preferences</h3>
              <p className="text-[10px] text-vcamp-muted">Compact Desktop Controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-vcamp-muted hover:text-vcamp-text hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {employee && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-vcamp-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-vcamp-muted flex items-center gap-1">
                <User className="w-3 h-3 text-vcamp-primary" />
                Active Profile
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-vcamp-secondary text-vcamp-primary font-semibold">
                {employee.role}
              </span>
            </div>
            <p className="text-xs font-semibold text-vcamp-text truncate">{employee.full_name}</p>
            <p className="text-[10px] text-vcamp-muted truncate">
              {employee.email} • {employee.department}
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-vcamp-text flex items-center gap-1.5 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-vcamp-primary" />
              Auto Voice Output (TTS)
            </span>
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="accent-vcamp-primary w-3.5 h-3.5 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-vcamp-text mb-1">
              <span>Speech Speed</span>
              <span className="font-mono text-vcamp-primary font-semibold">
                {speechRate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-vcamp-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-vcamp-text mb-1">
              <span className="flex items-center gap-1">
                <Languages className="w-3 h-3 text-vcamp-primary" />
                Language Mode
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {(['auto', 'ta', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLanguage(lang)}
                  className={`py-1 rounded-lg border font-semibold uppercase transition-colors ${
                    activeLanguage === lang
                      ? 'bg-vcamp-secondary border-vcamp-primary text-vcamp-primary'
                      : 'bg-white border-vcamp-border text-vcamp-muted hover:text-vcamp-text'
                  }`}
                >
                  {lang === 'auto' ? 'Auto' : lang === 'ta' ? 'தமிழ்' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              openCharacterStudio();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-vcamp-secondary hover:bg-blue-100 border border-blue-200 text-vcamp-primary font-semibold flex items-center justify-center gap-1.5 text-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Open 3D Character Studio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDashboardTab('overview');
              setIsDashboardOpen(true);
              onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-vcamp-border text-vcamp-text font-medium flex items-center justify-center gap-1.5 text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5 text-vcamp-primary" />
            <span>Open Full Workspace</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-vcamp-error font-medium flex items-center justify-center gap-1.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
