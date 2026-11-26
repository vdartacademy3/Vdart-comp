import React, { useEffect, useState } from 'react';
import { MessageSquare, Volume2, Cpu, Play, Square, CheckCircle2 } from 'lucide-react';
import { ChatWindow } from '../../chat/ChatWindow';
import { useCompanionStore } from '../../stores/companionStore';
import { speechService, TTSVoiceOption } from '../../services/speechService';
import {
  AI_PROVIDERS,
  AIProviderId,
  getSavedAIBaseUrl,
  getSavedAIProvider,
  saveAIBaseUrl,
  saveAIProvider,
} from '../../services/aiProviderService';

export const ConversationVoiceTab: React.FC = () => {
  const {
    groqApiKey,
    setGroqApiKey,
    groqModel,
    setGroqModel,
    systemPrompt,
    setSystemPrompt,
    autoSpeak,
    setAutoSpeak,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    speechVoice,
    setSpeechVoice,
  } = useCompanionStore();

  const [provider, setProvider] = useState<AIProviderId>(() => getSavedAIProvider());
  const [baseUrl, setBaseUrl] = useState(() => getSavedAIBaseUrl());
  const [voices, setVoices] = useState<TTSVoiceOption[]>([]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setVoices(speechService.getVoices());
  }, []);

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    saveAIProvider(provider);
    saveAIBaseUrl(baseUrl);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleTestVoice = () => {
    if (isTestingVoice) {
      speechService.stop();
      setIsTestingVoice(false);
      return;
    }
    setIsTestingVoice(true);
    speechService.speak('Hello! VCamp voice output and talk animation synchronization are ready.', {
      rate: speechRate,
      pitch: speechPitch,
      voiceName: speechVoice,
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false),
    });
  };

  const activeProviderMeta = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-vcamp-primary" />
          Conversation, Voice &amp; AI Provider
        </h3>
        <p className="text-xs text-vcamp-muted">
          Converse with VCamp, configure modular AI providers, and calibrate speech synthesis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Full Conversation Panel */}
        <div className="lg:col-span-6">
          <ChatWindow embedded className="w-full h-[520px]" />
        </div>

        {/* AI Provider + Voice Controls */}
        <div className="lg:col-span-6 space-y-4">
          <form
            onSubmit={handleSaveAI}
            className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-vcamp-primary" />
                AI Provider Configuration
              </h4>
              {savedNotice && (
                <span className="text-[11px] text-vcamp-success flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-vcamp-text mb-1">Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  const next = e.target.value as AIProviderId;
                  setProvider(next);
                  const found = AI_PROVIDERS.find((p) => p.id === next);
                  if (found) {
                    setBaseUrl(found.defaultBaseUrl);
                    setGroqModel(found.models[0]?.id || groqModel);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-vcamp-border bg-white text-vcamp-text outline-none focus:border-vcamp-primary"
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {provider === 'openai_compatible' && (
              <div>
                <label className="block font-semibold text-vcamp-text mb-1">Endpoint Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-vcamp-border bg-white text-vcamp-text outline-none focus:border-vcamp-primary"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-vcamp-text mb-1">Model</label>
                <select
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-vcamp-border bg-white text-vcamp-text outline-none focus:border-vcamp-primary"
                >
                  {activeProviderMeta.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-vcamp-text mb-1">API Key</label>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="Enter key (stored locally)"
                  disabled={provider === 'offline'}
                  className="w-full px-3 py-2 rounded-xl border border-vcamp-border bg-white text-vcamp-text outline-none focus:border-vcamp-primary disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-vcamp-text mb-1">Companion Instructions</label>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-vcamp-border bg-white text-vcamp-text outline-none focus:border-vcamp-primary resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white font-semibold"
            >
              Save AI Settings
            </button>
          </form>

          {/* Voice Interaction Controls */}
          <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-vcamp-primary" />
                Voice Input &amp; Speech Output
              </h4>
              <label className="flex items-center gap-1.5 font-medium text-vcamp-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="accent-vcamp-primary"
                />
                Auto-Speak Replies
              </label>
            </div>

            <div>
              <label className="block font-semibold text-vcamp-text mb-1">TTS Voice</label>
              <select
                value={speechVoice}
                onChange={(e) => setSpeechVoice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-vcamp-border bg-white text-vcamp-text outline-none focus:border-vcamp-primary"
              >
                <option value="">Auto-Select (Indian English / Tamil)</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-vcamp-muted">Rate</span>
                  <span className="font-mono text-vcamp-primary font-semibold">
                    {speechRate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-vcamp-primary"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-vcamp-muted">Pitch</span>
                  <span className="font-mono text-vcamp-primary font-semibold">
                    {speechPitch.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.4"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-vcamp-primary"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestVoice}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vcamp-secondary hover:bg-blue-100 text-vcamp-primary font-semibold border border-blue-200"
            >
              {isTestingVoice ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isTestingVoice ? 'Stop Speech Test' : 'Test Voice & TALK Animation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
