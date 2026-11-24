import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  Lock, 
  CheckCircle, 
  AlertTriangle,
  HardDrive,
  FileText
} from 'lucide-react';
import { feedbackStore } from '../../services/sentimentService';
import { userProfileService } from '../../services/userProfileService';
import { moodTimelineService } from '../../services/moodTimelineService';
import { useConversationStore } from '../../stores/conversationStore';

export const PrivacyTab: React.FC = () => {
  const [storeHistory, setStoreHistory] = useState(true);
  const [recordSentiment, setRecordSentiment] = useState(true);
  const [enableProsody, setEnableProsody] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleExportData = () => {
    const activeProfile = userProfileService.getActiveProfile();
    const exportObject = {
      exportTimestamp: new Date().toISOString(),
      userProfile: activeProfile,
      sentimentData: JSON.parse(feedbackStore.exportUserData(activeProfile.id || 'default_user')),
      conversationHistory: useConversationStore.getState().messages,
      moodTimeline: moodTimelineService.getEntries(activeProfile.id),
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vcamp_privacy_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Data successfully exported to local JSON file.');
  };

  const handleEraseData = () => {
    if (!window.confirm('Are you sure you want to completely erase all your local companion data? This cannot be undone.')) {
      return;
    }
    const activeProfile = userProfileService.getActiveProfile();
    feedbackStore.clearUserData(activeProfile.id || 'default_user');
    useConversationStore.getState().clearMessages();
    moodTimelineService.clearHistory(activeProfile.id);
    setStatusMsg('All personal conversation history, sentiment telemetry, and local feedback erased.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          Privacy Architecture & Data Isolation Guarantee
        </h3>
        <p className="text-xs text-slate-400">
          Transparent data governance, 100% local processing, and strict architectural separation between personal companion and corporate HR systems.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Strict Separation Guarantee Banner */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/30 space-y-3">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs uppercase tracking-wider">
          <Lock className="w-4 h-4 text-cyan-400" />
          Strict Companion — HR Isolation Guarantee
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          VCamp adheres to strict computational boundaries. Personal conversational sentiment, emotional check-ins, and companion interactions are stored <span className="text-cyan-300 font-semibold">strictly locally on your workstation</span>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-semibold text-emerald-400 block mb-1">✓ Personal Companion Sandbox</span>
            <p className="text-slate-400 text-[11px]">
              Emotional check-ins and conversations remain exclusively within your private desktop runtime. No telemetry is shared with managers or HR.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-semibold text-cyan-400 block mb-1">✓ Independent HR System Segregation</span>
            <p className="text-slate-400 text-[11px]">
              Corporate attendance, payroll, and enterprise management operate on separate decoupled infrastructure with zero access to your sentiment signals.
            </p>
          </div>
        </div>
      </div>

      {/* User Data Consent Controls */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Local Data Storage & Telemetry Preferences
        </h4>
        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Persist Conversation History</span>
              <span className="text-slate-400 text-[11px]">Store chat turns locally in indexed browser storage</span>
            </div>
            <input
              type="checkbox"
              checked={storeHistory}
              onChange={(e) => setStoreHistory(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Record Sentiment Telemetry</span>
              <span className="text-slate-400 text-[11px]">Save emotion trends and calibrated confidence scores for self-reflection</span>
            </div>
            <input
              type="checkbox"
              checked={recordSentiment}
              onChange={(e) => setRecordSentiment(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Acoustic Speech Prosody Corroboration</span>
              <span className="text-slate-400 text-[11px]">Allow speaking rate and energy to corroborate semantic sentiment</span>
            </div>
            <input
              type="checkbox"
              checked={enableProsody}
              onChange={(e) => setEnableProsody(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Export & Erase Data */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Data Portability & Erasure Rights
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export All My Data (JSON)
          </button>

          <button
            onClick={handleEraseData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Erase All My Data
          </button>
        </div>
      </div>
    </div>
  );
};
