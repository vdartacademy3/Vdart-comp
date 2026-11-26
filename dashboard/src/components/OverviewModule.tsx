import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import {
  Activity,
  Cpu,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const OverviewModule: React.FC = () => {
  const { employee } = useAuthStore();
  const [healthData, setHealthData] = useState<any>(null);
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
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#1769D2] font-semibold bg-[#EAF3FF] px-2.5 py-0.5 rounded-full border border-[#1769D2]/20">
              {employee?.role || 'EMPLOYEE'}
            </span>
            <span className="text-xs text-[#64748B] font-medium">
              Signed in as {employee?.full_name || 'User'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">
            VCamp Enterprise Companion Overview
          </h2>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Centralized monitoring for multilingual wellbeing insights, 3D desktop companion configuration, and tenant-isolated governance.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Core Platform</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
            {healthData?.status === 'healthy' ? 'Operational' : 'Active'}
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-[11px] text-[#64748B]">v{healthData?.version || '3.0.0'} FastAPI Engine</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">AI Provider</span>
            <Cpu className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-lg font-bold text-[#172B4D] truncate">
            {healthData?.ai_provider || healthData?.groq_model || 'Configured'}
          </div>
          <p className="text-[11px] text-[#64748B]">Modular LLM Pipeline</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Sentiment Engine</span>
            <HeartHandshake className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-lg font-bold text-[#172B4D]">
            Consent-Based NLP
          </div>
          <p className="text-[11px] text-[#64748B]">English, Tamil & Tanglish</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Data Boundary</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-[#172B4D]">
            Tenant Isolated
          </div>
          <p className="text-[11px] text-[#64748B]">Argon2id + k-Anonymity HR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#1769D2]" /> AI & Speech Pipeline
            </h3>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium">
              Online
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-[#64748B]">Conversational LLM</span>
              <span className="font-semibold text-[#172B4D]">{healthData?.groq_model || 'Configurable Provider'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-[#64748B]">Speech Transcription</span>
              <span className="font-semibold text-[#172B4D]">Whisper Multilingual / Browser STT</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-[#64748B]">Tamil & Tanglish NLP</span>
              <span className="font-semibold text-[#172B4D]">Calibrated Multi-Script Analyzer</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[#64748B]">3D Desktop Companion</span>
              <span className="font-semibold text-[#1769D2]">Tauri 2 + Three.js GLB Engine</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Privacy & Trust Safeguards
            </h3>
            <span className="text-[11px] bg-[#EAF3FF] text-[#1769D2] px-2.5 py-0.5 rounded-full border border-[#1769D2]/20 font-medium">
              Strict Isolation
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#172B4D]">Consent-First Sentiment Tracking</p>
                <p className="text-[11px] text-[#64748B]">Employees control opt-in sentiment recording, retention periods, and one-click history deletion.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#172B4D]">k-Anonymity Department Guardrail</p>
                <p className="text-[11px] text-[#64748B]">HR analytics only display aggregated metrics once departments meet the minimum anonymity threshold.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#172B4D]">Non-Diagnostic Support Framing</p>
                <p className="text-[11px] text-[#64748B]">Affective signals drive empathetic support and pattern-based check-ins without punitive scoring.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
