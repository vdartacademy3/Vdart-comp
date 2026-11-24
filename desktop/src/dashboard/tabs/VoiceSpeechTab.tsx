import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Play, 
  Square, 
  Sliders, 
  Sparkles, 
  Check, 
  RotateCcw,
  Languages
} from 'lucide-react';
import { useCompanionStore } from '../../stores/companionStore';
import { speechService, TTSVoiceOption } from '../../services/speechService';

export const VoiceSpeechTab: React.FC = () => {
  const { 
    autoSpeak, 
    setAutoSpeak, 
    speechRate, 
    setSpeechRate, 
    speechPitch, 
    setSpeechPitch, 
    speechVoice, 
    setSpeechVoice 
  } = useCompanionStore();

  const [voices, setVoices] = useState<TTSVoiceOption[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testSampleText, setTestSampleText] = useState(
    'வணக்கம்! நான் உங்கள் VCamp AI துணைவன். உங்களுக்கு உதவ நான் தயாராக இருக்கிறேன். How can I assist you today?'
  );

  useEffect(() => {
    setVoices(speechService.getVoices());
  }, []);

  const handleTestVoice = () => {
    if (isPlayingTest) {
      speechService.stop();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    speechService.speak(testSampleText, {
      rate: speechRate,
      pitch: speechPitch,
      voiceName: speechVoice,
      onEnd: () => setIsPlayingTest(false),
      onError: () => setIsPlayingTest(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          Natural Indian Voice Synthesis & Speech Engine
        </h3>
        <p className="text-xs text-slate-400">
          Indian English and Indian-language voice output tuning, phonetics, and speech synthesis parameters.
        </p>
      </div>

      {/* Voice Selection */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          TTS Voice Selection
        </h4>

        <div className="space-y-2">
          <select
            value={speechVoice}
            onChange={(e) => setSpeechVoice(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500"
          >
            <option value="">Default Recommended Voice</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang}) {v.isIndian ? '🇮🇳 Indian Accent' : ''}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400 block">
            VCamp prioritizes natural Indian English (en-IN), Microsoft Neerja/Prabhat, and Tamil phonetic voices.
          </span>
        </div>
      </div>

      {/* Speech Sliders */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Acoustic Prosody Tuning
        </h4>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Speaking Rate</span>
              <span className="font-mono text-cyan-400">{speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.50"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Speech Pitch</span>
              <span className="font-mono text-cyan-400">{speechPitch.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.30"
              step="0.05"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Auto-speak Assistant Replies</span>
              <span className="text-slate-400 text-[11px]">Automatically speak all Groq replies aloud</span>
            </div>
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Voice Testing Preview */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Test Audio Pronunciation
        </h4>

        <textarea
          rows={2}
          value={testSampleText}
          onChange={(e) => setTestSampleText(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
        />

        <button
          onClick={handleTestVoice}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
        >
          {isPlayingTest ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
          {isPlayingTest ? 'Stop Audio' : 'Play Voice Test'}
        </button>
      </div>
    </div>
  );
};
