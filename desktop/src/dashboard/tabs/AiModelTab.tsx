import React, { useState } from 'react';
import { 
  Cpu, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Sliders,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCompanionStore } from '../../stores/companionStore';
import { GROQ_MODELS } from '../../services/groqService';

export const AiModelTab: React.FC = () => {
  const { 
    groqApiKey, 
    setGroqApiKey, 
    groqModel, 
    setGroqModel, 
    systemPrompt, 
    setSystemPrompt,
    autoSpeak,
    setAutoSpeak 
  } = useCompanionStore();

  const [apiKeyInput, setApiKeyInput] = useState(groqApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setGroqApiKey(apiKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          AI Model Configuration & Inference Settings
        </h3>
        <p className="text-xs text-slate-400">
          Configure low-latency Groq LPU inference, language model backbones, and companion persona prompts.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Configuration saved successfully!</span>
        </div>
      )}

      {/* API Key */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Groq API Key
        </label>
        <p className="text-xs text-slate-400">
          Enter your Groq API Key to power real-time Whisper speech transcription and conversational reasoning.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
          >
            <Check className="w-4 h-4" />
            Save Key
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Active AI Model Backbone
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GROQ_MODELS.map((m) => {
            const isSelected = groqModel === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setGroqModel(m.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 shadow-sm'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {m.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">{m.id}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Persona Prompt */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Companion System Prompt (Persona & Instructions)
          </label>
        </div>
        <textarea
          rows={6}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-200 outline-none font-mono resize-y"
        />
      </div>
    </div>
  );
};
