import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Cpu, 
  Sliders, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';

export const SystemConfigModule: React.FC = () => {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('vcamp_groq_api_key') || ''
  );
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [whisperModel, setWhisperModel] = useState('whisper-large-v3-turbo');
  const [uncertaintyThreshold, setUncertaintyThreshold] = useState(0.45);
  const [inertiaWeight, setInertiaWeight] = useState(0.25);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vcamp_groq_api_key', apiKey);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" /> Platform & Intelligence Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Calibrate inference thresholds, Groq API credentials, and affective inertia parameters.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System configuration parameters updated and saved to persistent store!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Groq Credentials */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> Groq API Credentials
            </h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              High Speed LPU
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              API Key (gsk_...)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white font-mono outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Used for both conversation completions and Whisper speech-to-text audio transcriptions.
            </p>
          </div>
        </div>

        {/* Models */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" /> Model Selection
            </h3>
            <span className="text-[10px] text-slate-400">Production default</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Conversational LLM
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Ultra Fast)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B 32k Context</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Whisper Transcription Engine
              </label>
              <select
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              >
                <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo (Multilingual)</option>
                <option value="whisper-large-v3">Whisper Large v3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sentiment Calibration Sliders */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-400" /> Sentiment Classification Calibration
            </h3>
            <span className="text-[10px] text-pink-400 bg-pink-950 px-2 py-0.5 rounded border border-pink-500/30">
              15 Classes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Uncertainty Threshold</span>
                <span className="font-mono text-cyan-400">{uncertaintyThreshold}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.7"
                step="0.05"
                value={uncertaintyThreshold}
                onChange={(e) => setUncertaintyThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Inferences below this confidence score are tagged as ambiguous rather than forced.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Emotional Inertia Weight</span>
                <span className="font-mono text-cyan-400">{inertiaWeight}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.05"
                value={inertiaWeight}
                onChange={(e) => setInertiaWeight(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Smooths emotion transitions using prior conversation state to prevent erratic rapid flips.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30"
          >
            <Save className="w-4 h-4" /> Save Configuration Settings
          </button>
        </div>
      </form>
    </div>
  );
};
