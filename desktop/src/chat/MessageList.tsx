import React, { useRef, useEffect } from 'react';
import { useConversationStore, ChatMessage } from '../stores/conversationStore';
import { useCompanionStore, SentimentType } from '../stores/companionStore';
import { speechService } from '../services/speechService';
import { Volume2, VolumeX, Bot, User, Check } from 'lucide-react';

const SENTIMENT_EMOJIS: Record<SentimentType, { label: string; emoji: string; color: string }> = {
  happy: { label: 'Happy', emoji: '😊', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' },
  excited: { label: 'Excited', emoji: '🤩', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30' },
  sad: { label: 'Sad', emoji: '😢', color: 'text-blue-400 bg-blue-950/40 border-blue-500/30' },
  angry: { label: 'Angry', emoji: '😡', color: 'text-rose-400 bg-rose-950/40 border-rose-500/30' },
  frustrated: { label: 'Frustrated', emoji: '😤', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' },
  confused: { label: 'Confused', emoji: '🤔', color: 'text-purple-400 bg-purple-950/40 border-purple-500/30' },
  anxious: { label: 'Anxious', emoji: '😨', color: 'text-amber-300 bg-amber-950/40 border-amber-500/30' },
  calm: { label: 'Calm', emoji: '😌', color: 'text-sky-300 bg-sky-950/40 border-sky-500/30' },
  disappointed: { label: 'Disappointed', emoji: '😞', color: 'text-slate-400 bg-slate-950/40 border-slate-500/30' },
  motivated: { label: 'Motivated', emoji: '💪', color: 'text-teal-400 bg-teal-950/40 border-teal-500/30' },
  tired: { label: 'Tired', emoji: '🥱', color: 'text-slate-400 bg-slate-950/40 border-slate-600/30' },
  stressed: { label: 'Stressed', emoji: '😰', color: 'text-pink-400 bg-pink-950/40 border-pink-500/30' },
  curious: { label: 'Curious', emoji: '🧐', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30' },
  mixed: { label: 'Mixed', emoji: '🎭', color: 'text-violet-400 bg-violet-950/40 border-violet-500/30' },
  ambiguous: { label: 'Ambiguous', emoji: '❓', color: 'text-gray-400 bg-gray-900/40 border-gray-600/30' },
  insufficient_evidence: { label: 'Uncertain', emoji: '▫️', color: 'text-zinc-400 bg-zinc-900/40 border-zinc-700/30' },
  neutral: { label: 'Neutral', emoji: '😐', color: 'text-slate-400 bg-slate-900/40 border-slate-700/30' },
};

export const MessageList: React.FC = () => {
  const { messages, isLoading } = useConversationStore();
  const { isSpeaking, setIsSpeaking, setState, setSentiment, speechRate, speechPitch, speechVoice } = useCompanionStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      setState('idle');
      return;
    }

    setIsSpeaking(true);
    setState('speaking');

    speechService.speak(text, {
      rate: speechRate,
      pitch: speechPitch,
      voiceName: speechVoice,
      onStart: () => {
        setIsSpeaking(true);
        setState('speaking');
      },
      onEnd: () => {
        setIsSpeaking(false);
        setState('idle');
      },
      onError: () => {
        setIsSpeaking(false);
        setState('idle');
      },
    });
  };

  const handleCorrectSentiment = (msgId: string, currentSentiment: SentimentType) => {
    const sentimentOptions: SentimentType[] = ['happy', 'excited', 'neutral', 'confused', 'frustrated', 'sad', 'angry'];
    const nextIndex = (sentimentOptions.indexOf(currentSentiment) + 1) % sentimentOptions.length;
    const nextSentiment = sentimentOptions[nextIndex];

    useConversationStore.getState().updateMessage(msgId, {
      sentiment: nextSentiment,
      sentimentConfidence: 1.0,
    });
    setSentiment(nextSentiment, 1.0);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 pr-2 select-text">
      {messages.map((msg) => {
        const isAssistant = msg.role === 'assistant';
        const sentimentData = msg.sentiment ? SENTIMENT_EMOJIS[msg.sentiment] : null;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
          >
            <div
              className={`flex items-start gap-2 max-w-[88%] ${
                isAssistant ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isAssistant
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-400'
                    : 'bg-slate-800 border border-slate-600 text-slate-300'
                }`}
              >
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                  isAssistant
                    ? 'bg-slate-900/90 text-slate-100 border border-cyan-500/30 rounded-tl-sm shadow-sm'
                    : 'bg-cyan-600/90 text-white rounded-tr-sm shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                {/* Footer bar with Speak button & Timestamp */}
                <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/10 text-[10px] text-slate-400">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {isAssistant && (
                    <button
                      onClick={() => handleSpeak(msg.content)}
                      className="p-1 hover:text-cyan-400 transition-colors rounded"
                      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                    >
                      {isSpeaking ? <VolumeX className="w-3 h-3 text-cyan-400" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* User Sentiment Tag with click-to-correct */}
            {!isAssistant && sentimentData && (
              <div className="mt-1 mr-8 flex items-center gap-1.5">
                <button
                  onClick={() => handleCorrectSentiment(msg.id, msg.sentiment || 'neutral')}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-all hover:scale-105 ${sentimentData.color}`}
                  title="Click to correct emotion prediction"
                >
                  <span>{sentimentData.emoji}</span>
                  <span>{sentimentData.label}</span>
                  {msg.sentimentConfidence && (
                    <span className="opacity-70">
                      ({Math.round(msg.sentimentConfidence * 100)}%)
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Thinking / Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-cyan-400 text-xs pl-2">
          <Bot className="w-4 h-4 animate-spin text-cyan-400" />
          <span className="animate-pulse">VCamp is thinking... யோசிக்கிறேன்...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
