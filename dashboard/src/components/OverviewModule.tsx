import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  ShieldCheck, 
  Users, 
  HeartHandshake, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const OverviewModule: React.FC = () => {
  const { employee } = useAuthStore();
  const [healthData, setHealthData] = useState<any>(null);
  const [stats, setStats] = useState({
    activeEmployees: 2,
    todayInteractions: 14,
    sentimentAverage: 'Calm & Productive',
    groqLatency: '240 ms',
  });
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/system/health');
      setHealthData(data);
    } catch (e) {
      console.error('Failed to load system health', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              {employee?.role || 'EMPLOYEE'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Logged in as {employee?.full_name}</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            VCamp Enterprise Sentiment Intelligence Hub
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Centralized monitoring for real-time multilingual emotion analytics, 3D desktop companion configuration, and enterprise-grade tenant privacy isolation.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Core Platform</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            {healthData?.status === 'healthy' ? 'Operational' : 'Active'}
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[11px] text-slate-500">v{healthData?.version || '2.0.0'} FastAPI Engine</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Groq AI Backbone</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white truncate">
            {healthData?.groq_model || 'llama-3.3-70b'}
          </div>
          <p className="text-[11px] text-slate-500">Fast Token Completion</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Sentiment Engine</span>
            <HeartHandshake className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-lg font-bold text-white">
            15 Fine-grained Classes
          </div>
          <p className="text-[11px] text-slate-500">English, Tamil & Tanglish</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Data Boundary</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white">
            Tenant Isolated
          </div>
          <p className="text-[11px] text-slate-500">Argon2id + JWT Sessions</p>
        </div>
      </div>

      {/* Architecture & Engine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> Central AI & Speech Engines
            </h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              Online
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Conversational LLM</span>
              <span className="font-semibold text-slate-200">Llama 3.3 70B Versatile (Groq)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Speech Transcription</span>
              <span className="font-semibold text-slate-200">Whisper Large v3 Turbo (Groq)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Tamil Native NLP</span>
              <span className="font-semibold text-slate-200">Custom Unicode + Agglutinative Morph</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Tanglish Romanized NLP</span>
              <span className="font-semibold text-slate-200">Phonetic Normalizer & Code-Switch Filter</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Desktop Companion Mode</span>
              <span className="font-semibold text-cyan-400">Compact Floating 3D (Tauri 2 + Rust)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security & Privacy Compliance
            </h3>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
              Strict Isolation
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Zero Unconsented Surveillance</p>
                <p className="text-[11px] text-slate-400">Administrators view aggregate organization sentiment only; individual chat logs are strictly locked to the employee.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Modern Argon2id Password Cryptography</p>
                <p className="text-[11px] text-slate-400">Resistant against GPU/ASIC cracking with unique 16-byte cryptographic salts.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Decoupled Companion & Dashboard</p>
                <p className="text-[11px] text-slate-400">Desktop companion stays featherweight without bloated embedded dashboards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
