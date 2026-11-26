import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useCompanionStore } from '../stores/companionStore';
import { useConversationStore } from '../stores/conversationStore';
import {
  AI_PROVIDERS,
  AIProviderId,
  getSavedAIBaseUrl,
  getSavedAIProvider,
  saveAIBaseUrl,
  saveAIProvider,
} from '../services/aiProviderService';
import { X, Trash2, Key, Maximize2 } from 'lucide-react';

interface ChatWindowProps {
  style?: React.CSSProperties;
  className?: string;
  embedded?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ style, className, embedded = false }) => {
  const {
    state,
    isChatOpen,
    setIsChatOpen,
    groqApiKey,
    setGroqApiKey,
    groqModel,
    setGroqModel,
    setIsDashboardOpen,
    setActiveDashboardTab,
  } = useCompanionStore();
  const { clearMessages } = useConversationStore();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [provider, setProvider] = useState<AIProviderId>(() => getSavedAIProvider());
  const [baseUrl, setBaseUrl] = useState(() => getSavedAIBaseUrl());
  const [tempApiKey, setTempApiKey] = useState(groqApiKey);
  const [tempModel, setTempModel] = useState(groqModel);

  if (!embedded && !isChatOpen) return null;

  const handleSaveConfig = () => {
    saveAIProvider(provider);
    saveAIBaseUrl(baseUrl);
    setGroqApiKey(tempApiKey);
    setGroqModel(tempModel);
    setShowApiKeyModal(false);
  };

  return (
    <div
      style={style}
      className={`relative rounded-2xl vcamp-card flex flex-col overflow-hidden z-50 ${
        className || 'w-80 h-[400px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-vcamp-border bg-white select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-vcamp-primary inline-block" />
          <span className="font-bold text-xs text-vcamp-text tracking-tight">VCamp Assistant</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-vcamp-secondary text-vcamp-primary font-semibold uppercase">
            {state}
          </span>
        </div>

        <div className="flex items-center gap-1 text-vcamp-muted">
          <button
            type="button"
            onClick={() => {
              setTempApiKey(groqApiKey);
              setTempModel(groqModel);
              setShowApiKeyModal(true);
            }}
            className="p-1.5 hover:text-vcamp-primary hover:bg-vcamp-secondary rounded-lg transition-colors"
            title="AI Provider & API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          {!embedded && (
            <button
              type="button"
              onClick={() => {
                setActiveDashboardTab('overview');
                setIsDashboardOpen(true);
              }}
              className="p-1.5 hover:text-vcamp-primary hover:bg-vcamp-secondary rounded-lg transition-colors"
              title="Open Full Application Workspace"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={clearMessages}
            className="p-1.5 hover:text-vcamp-error hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {!embedded && (
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 hover:text-vcamp-text hover:bg-slate-100 rounded-lg transition-colors"
              title="Collapse Chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modular AI Provider Popover */}
      {showApiKeyModal && (
        <div className="absolute inset-0 bg-white z-50 p-4 flex flex-col justify-center space-y-3 overflow-y-auto">
          <h3 className="text-sm font-bold text-vcamp-text flex items-center gap-1.5">
            <Key className="w-4 h-4 text-vcamp-primary" /> AI Provider Configuration
          </h3>

          <div className="space-y-2 text-xs">
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
                    setTempModel(found.models[0]?.id || tempModel);
                  }
                }}
                className="w-full bg-white border border-vcamp-border rounded-lg p-2 text-vcamp-text outline-none focus:border-vcamp-primary"
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
                <label className="block font-semibold text-vcamp-text mb-1">Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-white border border-vcamp-border rounded-lg p-2 text-vcamp-text outline-none focus:border-vcamp-primary"
                />
              </div>
            )}

            {provider !== 'offline' && (
              <>
                <div>
                  <label className="block font-semibold text-vcamp-text mb-1">Model</label>
                  <input
                    type="text"
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    className="w-full bg-white border border-vcamp-border rounded-lg p-2 text-vcamp-text outline-none focus:border-vcamp-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-vcamp-text mb-1">API Key</label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Enter your provider API key"
                    className="w-full bg-white border border-vcamp-border rounded-lg p-2 text-vcamp-text outline-none focus:border-vcamp-primary"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowApiKeyModal(false)}
              className="px-3 py-1.5 text-xs text-vcamp-muted hover:text-vcamp-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-3 py-1.5 text-xs bg-vcamp-primary hover:bg-vcamp-primaryHover text-white rounded-lg font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <MessageList />
      <MessageInput />
    </div>
  );
};
