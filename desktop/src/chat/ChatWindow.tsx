import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useCompanionStore } from '../stores/companionStore';
import { useConversationStore } from '../stores/conversationStore';
import { X, Trash2, Key, LayoutDashboard, Settings } from 'lucide-react';

interface ChatWindowProps {
  style?: React.CSSProperties;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ style, className }) => {
  const { 
    state, 
    sentiment, 
    isChatOpen, 
    setIsChatOpen, 
    groqApiKey, 
    setGroqApiKey,
    isDashboardOpen,
    setIsDashboardOpen
  } = useCompanionStore();
  const { clearMessages } = useConversationStore();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(groqApiKey);

  if (!isChatOpen) return null;

  const handleSaveApiKey = () => {
    setGroqApiKey(tempApiKey);
    setShowApiKeyModal(false);
  };

  return (
    <div 
      style={style} 
      className={`relative rounded-2xl glass-panel flex flex-col overflow-hidden z-50 shadow-glow-cyan animate-in fade-in slide-in-from-left-4 duration-200 ${className || 'w-80 h-[380px]'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-cyan-500/20 bg-slate-950/60 select-none">
        <div className="flex items-center gap-2">
          {/* Glowing Status Dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>

          <span className="font-semibold text-xs text-slate-100 tracking-wide">VCamp AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
            {state}
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => {
              setTempApiKey(groqApiKey);
              setShowApiKeyModal(true);
            }}
            className="p-1 hover:text-cyan-400 transition-colors rounded"
            title="Configure Groq API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDashboardOpen(!isDashboardOpen)}
            className="p-1 hover:text-cyan-400 transition-colors rounded"
            title="Open Separate Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={clearMessages}
            className="p-1 hover:text-rose-400 transition-colors rounded"
            title="Clear Conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1 hover:text-white transition-colors rounded ml-1"
            title="Minimize Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Groq Key Modal */}
      {showApiKeyModal && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 p-4 flex flex-col justify-center animate-in fade-in">
          <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
            <Key className="w-4 h-4" /> Groq API Configuration
          </h3>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Enter your personal Groq API key from <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">console.groq.com</a> to enable ultra-fast Llama 3.3 and Whisper transcription.
          </p>
          <input
            type="password"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            placeholder="gsk_..."
            className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveApiKey}
              className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Message List */}
      <MessageList />

      {/* Message Input */}
      <MessageInput />
    </div>
  );
};
