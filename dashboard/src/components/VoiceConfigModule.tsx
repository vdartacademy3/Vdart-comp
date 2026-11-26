import React, { useState } from 'react';
import {
  Volume2,
  Play,
  CheckCircle2,
  Globe,
  Sliders,
} from 'lucide-react';

export const VoiceConfigModule: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState(
    localStorage.getItem('vcamp_speech_voice') || 'Google தமிழ் (India)'
  );
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [autoSpeak, setAutoSpeak] = useState(localStorage.getItem('vcamp_auto_speak') !== 'false');
  const [testSuccess, setTestSuccess] = useState(false);

  const indianVoices = [
    { name: 'Google தமிழ் (India)', lang: 'ta-IN', desc: 'Native Tamil intonation' },
    { name: 'Microsoft Valluvar Online (Tamil)', lang: 'ta-IN', desc: 'Natural Tamil prosody' },
    { name: 'Google हिन्दी (India)', lang: 'hi-IN', desc: 'Standard Hindi synthesis' },
    { name: 'Microsoft Heera - English (India)', lang: 'en-IN', desc: 'Indian English female' },
    { name: 'Microsoft Ravi - English (India)', lang: 'en-IN', desc: 'Indian English male' },
  ];

  const handleTestVoice = () => {
    localStorage.setItem('vcamp_speech_voice', selectedVoice);
    localStorage.setItem('vcamp_auto_speak', String(autoSpeak));
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        selectedVoice.includes('தமிழ்') || selectedVoice.includes('Tamil')
          ? 'வணக்கம்! நான் உங்கள் வி-கேம்ப் AI தோழன். உங்களுக்கு எப்படி உதவ முடியும்?'
          : 'Hello! I am VCamp, your workplace AI companion.'
      );
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      window.speechSynthesis.speak(utterance);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[#1769D2]" /> Voice & Speech Synthesis
        </h2>
        <p className="text-xs text-[#64748B]">
          Configure regional voice profiles, speech rate, and pitch prosody.
        </p>
      </div>

      {testSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Playing voice preview via Web Speech synthesis...</span>
        </div>
      )}

      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#1769D2]" /> Regional Voice Catalog
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {indianVoices.map((v) => {
            const isSelected = selectedVoice === v.name;
            return (
              <button
                key={v.name}
                type="button"
                onClick={() => setSelectedVoice(v.name)}
                className={`p-3.5 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-[#EAF3FF] border-[#1769D2] text-[#172B4D]'
                    : 'bg-slate-50 border-slate-200 text-[#172B4D] hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs">{v.name}</span>
                  <span className="text-[10px] font-mono text-[#1769D2] bg-white px-2 py-0.5 rounded border border-[#1769D2]/20">
                    {v.lang}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">{v.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#1769D2]" /> Speech Rate & Pitch Prosody
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#172B4D]">Speech Rate</span>
              <span className="font-mono text-[#1769D2] font-semibold">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-[#1769D2] cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#172B4D]">Speech Pitch</span>
              <span className="font-mono text-[#1769D2] font-semibold">{speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full accent-[#1769D2] cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="accent-[#1769D2] rounded"
            />
            <span className="text-[#172B4D] font-medium">Automatically speak companion responses</span>
          </label>

          <button
            type="button"
            onClick={handleTestVoice}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white font-semibold text-xs shadow-sm"
          >
            <Play className="w-3.5 h-3.5" /> Test Voice Sample
          </button>
        </div>
      </div>
    </div>
  );
};
