import React, { useState } from 'react';
import { 
  Volume2, 
  Mic, 
  Play, 
  Save, 
  CheckCircle2, 
  Globe, 
  Sliders,
  Sparkles
} from 'lucide-react';

export const VoiceConfigModule: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState('Google தமிழ் (India)');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [testSuccess, setTestSuccess] = useState(false);

  const indianVoices = [
    { name: 'Google தமிழ் (India)', lang: 'ta-IN', desc: 'Native Tamil female intonation' },
    { name: 'Microsoft Valluvar Online (Tamil)', lang: 'ta-IN', desc: 'Natural Tamil prosody' },
    { name: 'Google हिन्दी (India)', lang: 'hi-IN', desc: 'Standard Hindi synthesis' },
    { name: 'Microsoft Heera - English (India)', lang: 'en-IN', desc: 'Indian English neutral accent' },
    { name: 'Microsoft Ravi - English (India)', lang: 'en-IN', desc: 'Indian English male professional' },
  ];

  const handleTestVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        selectedVoice.includes('தமிழ்')
          ? 'வணக்கம்! நான் உங்கள் வி-கேம்ப் 3D தோழன். உங்களுக்கு எப்படி உதவ முடியும்?'
          : 'Hello! I am your VCamp 3D Companion with real-time sentiment intelligence.'
      );
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      window.speechSynthesis.speak(utterance);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" /> Indian Voice & Speech Synthesis
          </h2>
          <p className="text-xs text-slate-400">
            Configure culturally authentic regional voice profiles, pitch, and prosody parameters.
          </p>
        </div>
      </div>

      {testSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Synthesizing voice preview through browser Web Speech API...</span>
        </div>
      )}

      {/* Voice Selection */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" /> Regional Voice Catalog
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {indianVoices.map((v) => {
            const isSelected = selectedVoice === v.name;
            return (
              <button
                key={v.name}
                type="button"
                onClick={() => setSelectedVoice(v.name)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-white">{v.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    {v.lang}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{v.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pitch and Speed sliders */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" /> Speech Rate & Pitch Prosody
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Speech Rate</span>
              <span className="font-mono text-cyan-400">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Speech Pitch</span>
              <span className="font-mono text-cyan-400">{speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">Automatically speak companion responses</span>
          </label>

          <button
            type="button"
            onClick={handleTestVoice}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md"
          >
            <Play className="w-3.5 h-3.5" /> Test Voice Sample
          </button>
        </div>
      </div>
    </div>
  );
};
