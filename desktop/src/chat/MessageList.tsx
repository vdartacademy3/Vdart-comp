import React, { useRef, useEffect } from 'react';
import { useConversationStore } from '../stores/conversationStore';
import { useCompanionStore, SentimentType } from '../stores/companionStore';
import { speechService } from '../services/speechService';
import { Volume2, VolumeX, Bot, User } from 'lucide-react';

const SENTIMENT_BADGES: Record<SentimentType, { label: string; style: string }> = {
  happy: { label: 'Happy', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  excited: { label: 'Excited', style: 'text-blue-700 bg-blue-50 border-blue-200' },
  motivated: { label: 'Motivated', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  calm: { label: 'Calm', style: 'text-sky-700 bg-sky-50 border-sky-200' },
  curious: { label: 'Curious', style: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  neutral: { label: 'Neutral', style: 'text-slate-600 bg-slate-100 border-slate-200' },
  confused: { label: 'Confused', style: 'text-amber-700 bg-amber-50 border-amber-200' },
  anxious: { label: 'Anxious', style: 'text-amber-700 bg-amber-50 border-amber-200' },
  tired: { label: 'Tired', style: 'text-slate-700 bg-slate-100 border-slate-300' },
  stressed: { label: 'Stressed', style: 'text-amber-800 bg-amber-50 border-amber-300' },
  frustrated: { label: 'Frustrated', style: 'text-red-700 bg-red-50 border-red-200' },
  sad: { label: 'Sad', style: 'text-blue-700 bg-blue-50 border-blue-200' },
  angry: { label: 'Angry', style: 'text-red-700 bg-red-50 border-red-200' },
  disappointed: { label: 'Disappointed', style: 'text-slate-700 bg-slate-100 border-slate-300' },
  mixed: { label: 'Mixed', style: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  ambiguous: { label: 'Unclear', style: 'text-slate-600 bg-slate-100 border-slate-200' },
  insufficient_evidence: { label: 'Minimal', style: 'text-slate-500 bg-slate-50 border-slate-200' },
};

export const MessageList: React.FC = () => {
  const { messages, isLoading } = useConversationStore();
  const { isSpeaking, setIsSpeaking, setState, setSentiment, speechRate, speechPitch, speechVoice } =
    useCompanionStore();
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
    const sentimentOptions: SentimentType[] = [
      'happy',
      'motivated',
      'neutral',
      'confused',
      'stressed',
      'frustrated',
      'sad',
    ];
    const nextIndex = (sentimentOptions.indexOf(currentSentiment) + 1) % sentimentOptions.length;
    const nextSentiment = sentimentOptions[nextIndex];

    useConversationStore.getState().updateMessage(msgId, {
      sentiment: nextSentiment,
      sentimentConfidence: 1.0,
    });
    setSentiment(nextSentiment, 1.0);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/70 select-text">
      {messages.map((msg) => {
        const isAssistant = msg.role === 'assistant';
        const sentimentData = msg.sentiment ? SENTIMENT_BADGES[msg.sentiment] : null;

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
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isAssistant
                    ? 'bg-vcamp-secondary border-blue-200 text-vcamp-primary'
                    : 'bg-white border-vcamp-border text-vcamp-muted'
                }`}
              >
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                  isAssistant
                    ? 'bg-white text-vcamp-text border border-vcamp-border rounded-tl-sm shadow-card'
                    : 'bg-vcamp-primary text-white rounded-tr-sm shadow-card'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                <div
                  className={`flex items-center justify-between gap-2 mt-1.5 pt-1 border-t text-[10px] ${
                    isAssistant
                      ? 'border-slate-100 text-vcamp-muted'
                      : 'border-white/20 text-blue-100'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {isAssistant && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.content)}
                      className="p-0.5 hover:text-vcamp-primary transition-colors rounded"
                      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-3 h-3 text-vcamp-primary" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!isAssistant && sentimentData && (
              <div className="mt-1 mr-8 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCorrectSentiment(msg.id, msg.sentiment || 'neutral')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${sentimentData.style}`}
                  title="Click to adjust sentiment label"
                >
                  <span>{sentimentData.label}</span>
                  {msg.sentimentConfidence && (
                    <span className="opacity-75">
                      ({Math.round(msg.sentimentConfidence * 100)}%)
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="flex items-center gap-2 text-vcamp-primary text-xs pl-2">
          <Bot className="w-4 h-4 animate-spin" />
          <span>Thinking...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
