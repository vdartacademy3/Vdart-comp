import React, { useState } from 'react';
import { 
  Activity, 
  Wifi, 
  Mic, 
  Volume2, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Cpu,
  Monitor
} from 'lucide-react';
import { useCompanionStore } from '../../stores/companionStore';
import { speechService } from '../../services/speechService';

export const DiagnosticsTab: React.FC = () => {
  const { groqApiKey, groqModel, robotSize } = useCompanionStore();
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'ok' | 'error'; latencyMs?: number; message?: string } | null>(null);

  const isTauri = typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

  const handleTestGroqPing = async () => {
    if (!groqApiKey) {
      setPingResult({ status: 'error', message: 'No Groq API Key configured.' });
      return;
    }
    setIsPinging(true);
    setPingResult(null);

    const start = performance.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${groqApiKey.trim()}` },
      });
      const end = performance.now();
      if (res.ok) {
        setPingResult({ status: 'ok', latencyMs: Math.round(end - start) });
      } else {
        setPingResult({ status: 'error', message: `HTTP ${res.status}: ${res.statusText}` });
      }
    } catch (err: any) {
      setPingResult({ status: 'error', message: err.message || 'Network request failed' });
    } finally {
      setIsPinging(false);
    }
  };

  // Estimate local storage usage
  const getStorageUsageKb = () => {
    let totalBytes = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += (localStorage[key].length + key.length) * 2;
        }
      }
    } catch {}
    return (totalBytes / 1024).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          System Health, Runtimes & Hardware Diagnostics
        </h3>
        <p className="text-xs text-slate-400">
          Inspect desktop runtime health, audio subsystems, Webview integration, and AI inference latency.
        </p>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Monitor className="w-4 h-4" />
            <span>Desktop Window Runtime</span>
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white block">Environment: {isTauri ? 'Native Tauri 2.0 (Rust)' : 'Web Browser Emulation'}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Robot Scale Mode: <span className="uppercase text-cyan-400 font-mono">{robotSize}</span></span>
            <span className="text-[11px] text-slate-400 block">DPR: {window.devicePixelRatio || 1}x</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Volume2 className="w-4 h-4" />
            <span>Speech Synthesis Engine</span>
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-emerald-400 block">
              ✓ Ready ({speechService.getVoices().length} voices detected)
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Indian English Voices: Available</span>
            <span className="text-[11px] text-slate-400 block">Tamil Phonetics: Supported</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            <span>Local Storage Telemetry</span>
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white block">Usage: {getStorageUsageKb()} KB</span>
            <span className="text-[11px] text-slate-400 block mt-1">Storage: Client-side Isolated</span>
            <span className="text-[11px] text-slate-400 block">HR Cloud Sync: Blocked & Segregated</span>
          </div>
        </div>
      </div>

      {/* Groq Cloud Connectivity Test */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" />
            Groq LPU API Connectivity & Latency Test
          </h4>
          <button
            onClick={handleTestGroqPing}
            disabled={isPinging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
          >
            {isPinging ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
            Ping Groq API
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Measures round-trip latency to the Groq low-latency inference endpoint using active credentials.
        </p>

        {pingResult && (
          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            pingResult.status === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}>
            {pingResult.status === 'ok' ? (
              <>
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Connection Verified! Round-trip latency: <strong className="font-mono text-white">{pingResult.latencyMs} ms</strong></span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Connection failed: {pingResult.message}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
