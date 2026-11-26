import React, { useState } from 'react';
import {
  Settings,
  Key,
  Cpu,
  Sliders,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const SystemConfigModule: React.FC = () => {
  const [provider, setProvider] = useState(localStorage.getItem('vcamp_ai_provider') || 'groq');
  const [apiKey, setApiKey] = useState(localStorage.getItem('vcamp_groq_api_key') || '');
  const [model, setModel] = useState(localStorage.getItem('vcamp_groq_model') || 'llama-3.3-70b-versatile');
  const [whisperModel, setWhisperModel] = useState('whisper-large-v3-turbo');
  const [uncertaintyThreshold, setUncertaintyThreshold] = useState(0.45);
  const [inertiaWeight, setInertiaWeight] = useState(0.25);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vcamp_ai_provider', provider);
    localStorage.setItem('vcamp_groq_api_key', apiKey);
    localStorage.setItem('vcamp_groq_model', model);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1769D2]" /> Platform & AI Configuration
        </h2>
        <p className="text-xs text-[#64748B]">
          Configure AI providers, inference parameters, and sentiment calibration thresholds.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>System configuration updated and saved locally.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#1769D2]" /> AI Provider Credentials
            </h3>
            <span className="text-[11px] text-[#1769D2] bg-[#EAF3FF] px-2.5 py-0.5 rounded-full border border-[#1769D2]/20 font-medium">
              Modular Provider
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">Provider Backend</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-300 focus:border-[#1769D2] text-xs text-[#172B4D] outline-none"
              >
                <option value="groq">Groq Cloud (Fast LPU)</option>
                <option value="openai_compatible">OpenAI-Compatible Endpoint</option>
                <option value="offline">Offline Deterministic Fallback</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter provider API key"
                className="w-full p-2.5 rounded-lg bg-white border border-slate-300 focus:border-[#1769D2] text-xs text-[#172B4D] font-mono outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#1769D2]" /> Model Selection
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">Conversational LLM</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-300 focus:border-[#1769D2] text-xs text-[#172B4D] outline-none"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                <option value="qwen/qwen3-32b">Qwen 3 32B</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">Whisper Transcription Engine</label>
              <select
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-300 focus:border-[#1769D2] text-xs text-[#172B4D] outline-none"
              >
                <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo (Multilingual)</option>
                <option value="whisper-large-v3">Whisper Large v3</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1769D2]" /> Sentiment Calibration
            </h3>
            <span className="text-[11px] text-[#64748B]">Ambiguity & Inertia</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#172B4D]">Uncertainty Threshold</span>
                <span className="font-mono text-[#1769D2] font-semibold">{uncertaintyThreshold}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.7"
                step="0.05"
                value={uncertaintyThreshold}
                onChange={(e) => setUncertaintyThreshold(parseFloat(e.target.value))}
                className="w-full accent-[#1769D2] cursor-pointer"
              />
              <p className="text-[11px] text-[#64748B]">
                Low-confidence messages are marked ambiguous rather than forced into a class.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#172B4D]">Emotional Inertia Weight</span>
                <span className="font-mono text-[#1769D2] font-semibold">{inertiaWeight}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.05"
                value={inertiaWeight}
                onChange={(e) => setInertiaWeight(parseFloat(e.target.value))}
                className="w-full accent-[#1769D2] cursor-pointer"
              />
              <p className="text-[11px] text-[#64748B]">
                Smooths mood shifts across turns using recent conversational context.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
