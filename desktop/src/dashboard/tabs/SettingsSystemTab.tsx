import React, { useEffect, useState } from 'react';
import {
  Settings,
  Monitor,
  ShieldCheck,
  Download,
  Trash2,
  Server,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCompanionStore, RobotSize } from '../../stores/companionStore';
import { useConversationStore } from '../../stores/conversationStore';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../services/apiClient';
import { localDataService } from '../../services/localDataService';
import { moodTimelineService } from '../../services/moodTimelineService';
import { userProfileService } from '../../services/userProfileService';

export const SettingsSystemTab: React.FC = () => {
  const { robotSize, setRobotSize } = useCompanionStore();
  const { clearMessages } = useConversationStore();
  const { authMode, logout } = useAuthStore();

  const [autostart, setAutostart] = useState(false);
  const [dataDir, setDataDir] = useState('LocalStorage');
  const [backendUrl, setBackendUrl] = useState(apiClient.getBaseUrl());
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    localDataService.getAppDataDir().then(setDataDir);
    localDataService.getAutostartEnabled().then(setAutostart);
  }, []);

  const handleToggleAutostart = async (next: boolean) => {
    const res = await localDataService.setAutostartEnabled(next);
    setAutostart(res);
    setNotice(res ? 'Enabled Windows startup launch.' : 'Disabled Windows startup launch.');
  };

  const handleCheckBackend = async () => {
    apiClient.setBaseUrl(backendUrl);
    try {
      const res = await fetch(`${apiClient.getBaseUrl()}/system/health`);
      if (res.ok) {
        setHealthStatus('online');
        setNotice('Backend server is reachable and healthy.');
      } else {
        setHealthStatus('offline');
      }
    } catch {
      setHealthStatus('offline');
      setNotice('Backend server not reachable; Local Standalone mode remains active.');
    }
  };

  const handleExportLocalData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: userProfileService.getActiveProfile(),
      moodHistory: moodTimelineService.getEntries(),
      messages: useConversationStore.getState().messages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vcamp_personal_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Personal data exported to JSON.');
  };

  const handleWipeAllPersonalData = () => {
    moodTimelineService.clearHistory();
    clearMessages();
    setNotice('Local conversation and mood history cleared.');
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
          <Settings className="w-5 h-5 text-vcamp-primary" />
          Settings, Windows Integration &amp; System Status
        </h3>
        <p className="text-xs text-vcamp-muted">
          Configure desktop companion footprint, Windows startup behavior, backend server, and data controls.
        </p>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-vcamp-secondary border border-blue-200 text-xs text-vcamp-primary font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Compact Companion Footprint */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3">
        <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-vcamp-primary" />
          Compact Companion Window Size
        </h4>
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          {(['small', 'medium', 'large'] as RobotSize[]).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setRobotSize(sz)}
              className={`p-3 rounded-xl border capitalize font-semibold transition-colors ${
                robotSize === sz
                  ? 'bg-vcamp-secondary border-vcamp-primary text-vcamp-primary'
                  : 'bg-white border-vcamp-border text-vcamp-text hover:bg-slate-50'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Windows Integration */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3 text-xs">
        <h4 className="font-bold text-vcamp-text uppercase tracking-wider">
          Windows Desktop Runtime
        </h4>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-vcamp-border">
          <div>
            <p className="font-semibold text-vcamp-text">Launch VCamp with Windows</p>
            <p className="text-[11px] text-vcamp-muted">
              Starts minimized in system tray when signing into Windows 10/11.
            </p>
          </div>
          <input
            type="checkbox"
            checked={autostart}
            onChange={(e) => handleToggleAutostart(e.target.checked)}
            disabled={!localDataService.isDesktopRuntime()}
            className="accent-vcamp-primary w-4 h-4 cursor-pointer"
          />
        </div>
        <div className="text-[11px] text-vcamp-muted">
          Data Storage Location: <span className="font-mono text-vcamp-text">{dataDir}</span>
        </div>
      </div>

      {/* Optional Enterprise Server Connection */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-4 h-4 text-vcamp-primary" />
            Backend API Diagnostics ({authMode})
          </h4>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
              healthStatus === 'online'
                ? 'bg-emerald-50 text-vcamp-success border border-emerald-200'
                : healthStatus === 'offline'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-vcamp-muted'
            }`}
          >
            {healthStatus === 'online'
              ? 'Connected'
              : healthStatus === 'offline'
              ? 'Local Mode'
              : 'Not Checked'}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-vcamp-border text-vcamp-text outline-none focus:border-vcamp-primary"
          />
          <button
            type="button"
            onClick={handleCheckBackend}
            className="px-4 py-2 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white font-semibold"
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* Privacy, Export & Deletion Controls */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3 text-xs">
        <h4 className="font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-vcamp-primary" />
          Privacy, Export &amp; Retention Controls
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportLocalData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vcamp-secondary hover:bg-blue-100 border border-blue-200 text-vcamp-primary font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            Export My Data (JSON)
          </button>
          <button
            type="button"
            onClick={handleWipeAllPersonalData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-vcamp-error font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Local History
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-vcamp-border text-vcamp-text font-semibold"
          >
            <AlertCircle className="w-3.5 h-3.5 text-vcamp-muted" />
            Switch User / Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
