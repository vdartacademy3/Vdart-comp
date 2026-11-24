import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Download, 
  Trash2, 
  Bot, 
  User, 
  Languages, 
  Smile,
  Volume2
} from 'lucide-react';
import { useConversationStore } from '../../stores/conversationStore';
import { useCompanionStore } from '../../stores/companionStore';
import { speechService } from '../../services/speechService';

export const ConversationsTab: React.FC = () => {
  const { messages, clearMessages } = useConversationStore();
  const { speechRate, speechPitch, speechVoice } = useCompanionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState<string>('all');

  const filteredMessages = messages.filter((m) => {
    const matchesSearch = m.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSentiment = selectedSentimentFilter === 'all' || m.sentiment === selectedSentimentFilter;
    return matchesSearch && matchesSentiment;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vcamp_conversations_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all conversation history?')) {
      clearMessages();
    }
  };

  const handleSpeakText = (text: string) => {
    speechService.speak(text, {
      rate: speechRate,
      pitch: speechPitch,
      voiceName: speechVoice,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Conversations & Multilingual Chat History
          </h3>
          <p className="text-xs text-slate-400">
            Search, filter, and audit past interaction turns with embedded sentiment tags and language detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Clear History
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversation turns..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedSentimentFilter}
          onChange={(e) => setSelectedSentimentFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 capitalize"
        >
          <option value="all">All Emotions</option>
          <option value="happy">Happy</option>
          <option value="excited">Excited</option>
          <option value="motivated">Motivated</option>
          <option value="calm">Calm</option>
          <option value="curious">Curious</option>
          <option value="neutral">Neutral</option>
          <option value="sad">Sad</option>
          <option value="frustrated">Frustrated</option>
          <option value="angry">Angry</option>
          <option value="anxious">Anxious</option>
          <option value="stressed">Stressed</option>
          <option value="tired">Tired</option>
        </select>
      </div>

      {/* Messages Feed */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-3">
        {filteredMessages.length > 0 ? (
          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border ${
                    isUser
                      ? 'bg-slate-900/90 border-slate-800 ml-6'
                      : 'bg-cyan-950/20 border-cyan-500/20 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isUser ? (
                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                          <User className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-white">
                          <Bot className="w-3 h-3" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-white capitalize">{msg.role}</span>
                      {msg.language && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400">
                          {msg.language}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.sentiment && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 capitalize">
                          {msg.sentiment} {msg.sentimentConfidence ? `(${(msg.sentimentConfidence * 100).toFixed(0)}%)` : ''}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleSpeakText(msg.content)}
                        className="text-slate-400 hover:text-cyan-400"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic p-6 text-center">No messages matching current criteria.</p>
        )}
      </div>
    </div>
  );
};
