import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { useConversationStore } from '../stores/conversationStore';
import { useCompanionStore } from '../stores/companionStore';
import { sendGroqChatMessage, detectLanguage } from '../services/groqService';
import { analyzeSentimentLocal, analyzeSentimentWithAI } from '../services/sentimentService';
import { AudioRecordingService, transcribeAudioWithGroq } from '../services/transcriptionService';
import { speechService } from '../services/speechService';
import { reminderService } from '../services/reminderService';
import { moodTimelineService } from '../services/moodTimelineService';
import { questionBankService } from '../services/questionBankService';
import { apiClient } from '../services/apiClient';

const recorder = new AudioRecordingService();

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { addMessage, updateMessage, messages, setIsLoading, setError, isLoading } = useConversationStore();
  const {
    state,
    setState,
    setSentiment,
    isRecording,
    setIsRecording,
    isSpeaking,
    setIsSpeaking,
    groqApiKey,
    groqModel,
    systemPrompt,
    autoSpeak,
    speechRate,
    speechPitch,
    speechVoice,
  } = useCompanionStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || isLoading) return;

    // Reset input
    setInput('');
    setStatusMessage(null);

    // Stop speaking if currently playing
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    }

    // 1. Analyze Sentiment instantly & record in Mood Timeline
    const localSentiment = analyzeSentimentLocal(textToSend);
    setSentiment(localSentiment.sentiment, localSentiment.confidence);
    moodTimelineService.recordMood(localSentiment.sentiment, localSentiment.confidence, textToSend);

    // Natural Language Smart Reminder detection
    const parsedReminder = reminderService.parseNaturalLanguage(textToSend);
    if (parsedReminder) {
      reminderService.addReminder({
        title: parsedReminder.title,
        dueTime: parsedReminder.dueTime,
        priority: parsedReminder.priority,
      });
      setStatusMessage(`⏰ Reminder set: "${parsedReminder.title}" (${parsedReminder.dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
    }

    // Map sentiment to companion expression
    if (localSentiment.sentiment === 'happy' || localSentiment.sentiment === 'excited') {
      setState('happy');
    } else if (localSentiment.sentiment === 'sad') {
      setState('empathetic');
    } else if (localSentiment.sentiment === 'confused') {
      setState('confused');
    }

    // 2. Add user message to conversation store
    const userMsg = addMessage({
      role: 'user',
      content: textToSend,
      language: detectLanguage(textToSend),
      sentiment: localSentiment.sentiment,
      sentimentConfidence: localSentiment.confidence,
    });

    // Background sentiment refinement with AI if API key is present
    if (groqApiKey) {
      analyzeSentimentWithAI(textToSend, groqApiKey).then((aiSentiment) => {
        updateMessage(userMsg.id, {
          sentiment: aiSentiment.sentiment,
          sentimentConfidence: aiSentiment.confidence,
        });
        setSentiment(aiSentiment.sentiment, aiSentiment.confidence);
      }).catch(() => {});
    }

    // 3. Trigger thinking state & Groq chat completion
    setIsLoading(true);
    setState('thinking');

    try {
      let replyContent = '';
      let replyLanguage: 'ta' | 'en' | 'tanglish' = 'en';

      // Prefer Central Secure Backend if employee is logged in
      if (apiClient.getToken()) {
        try {
          const chatRes = await apiClient.post('/conversations/chat', {
            message: textToSend,
          });
          replyContent = chatRes.reply;
          if (chatRes.detected_language === 'ta' || chatRes.detected_language === 'tanglish') {
            replyLanguage = chatRes.detected_language;
          } else {
            replyLanguage = 'en';
          }

          if (chatRes.sentiment) {
            const sem = chatRes.sentiment.primary_emotion as any;
            const conf = chatRes.sentiment.confidence || 0.85;
            setSentiment(sem, conf);
            updateMessage(userMsg.id, {
              sentiment: sem,
              sentimentConfidence: conf,
            });

            // Map backend 15-class sentiment to companion character animation
            if (['happy', 'excited', 'motivated'].includes(sem)) {
              setState('happy');
            } else if (['sad', 'disappointed', 'tired', 'anxious', 'stressed', 'frustrated'].includes(sem)) {
              setState('empathetic');
            } else if (['confused', 'curious'].includes(sem)) {
              setState('confused');
            }
          }

          if (chatRes.detected_reminders && chatRes.detected_reminders.length > 0) {
            setStatusMessage(`⏰ Synced ${chatRes.detected_reminders.length} reminder(s) to your personal calendar`);
          }
        } catch (backendErr) {
          console.warn('Backend chat fallback to direct Groq:', backendErr);
        }
      }

      // If backend was not used or failed, fallback to direct client-side Groq call
      if (!replyContent) {
        const response = await sendGroqChatMessage({
          apiKey: groqApiKey,
          model: groqModel,
          systemPrompt,
          messages: [...messages, userMsg],
        });
        replyContent = response.content;
        replyLanguage = response.language;
      }

      // 4. Add assistant reply to conversation store
      const assistantMsg = addMessage({
        role: 'assistant',
        content: replyContent,
        language: replyLanguage,
        sentiment: 'neutral',
      });

      // 5. Speech synthesis if auto-speak is enabled
      if (autoSpeak) {
        setIsSpeaking(true);
        setState('speaking');
        speechService.speak(replyContent, {
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
      } else {
        setState('idle');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg = err.message || 'Failed to communicate with Groq AI.';
      setError(errMsg);
      setState('confused');
      addMessage({
        role: 'assistant',
        content: `⚠️ Error: ${errMsg}`,
        sentiment: 'confused',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice recording workflow with Groq Whisper
  const handleToggleVoice = async () => {
    if (isRecording) {
      // STOP recording and transcribe
      try {
        setIsRecording(false);
        setTranscribing(true);
        setStatusMessage('Transcribing audio with Whisper...');
        setState('thinking');

        const audioBlob = await recorder.stopRecording();
        const transcription = await transcribeAudioWithGroq(audioBlob, groqApiKey);

        setTranscribing(false);
        setStatusMessage(null);

        if (transcription.text) {
          // Immediately send transcribed voice message
          await handleSend(transcription.text);
        } else {
          setStatusMessage('No speech detected. Please try again.');
          setState('idle');
        }
      } catch (err: any) {
        setTranscribing(false);
        setIsRecording(false);
        setStatusMessage(`Mic error: ${err.message}`);
        setState('confused');
      }
    } else {
      // START recording
      try {
        if (!groqApiKey) {
          setStatusMessage('Please enter Groq API Key first to enable voice transcription.');
          return;
        }

        // Stop speaking if currently active
        if (isSpeaking) {
          speechService.stop();
          setIsSpeaking(false);
        }

        setStatusMessage('Listening... பேசுங்கள்... (Click mic to finish)');
        setIsRecording(true);
        setState('listening');
        await recorder.startRecording();
      } catch (err: any) {
        setIsRecording(false);
        setStatusMessage(err.message);
        setState('idle');
      }
    }
  };

  return (
    <div className="p-2 border-t border-cyan-500/20 bg-slate-900/90">
      {/* Status banner for recording / transcribing / errors */}
      {(statusMessage || isRecording || transcribing) && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded text-[11px] ${
            isRecording
              ? 'bg-rose-950/70 border border-rose-500/50 text-rose-300 recording-pulse'
              : transcribing
              ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300'
              : 'bg-amber-950/70 border border-amber-500/50 text-amber-300'
          }`}
        >
          {isRecording ? (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block mr-1" />
          ) : transcribing ? (
            <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span className="truncate">{statusMessage || (isRecording ? 'Listening... பேசுங்கள்...' : '')}</span>
        </div>
      )}

      {/* Input controls row */}
      <div className="flex items-end gap-1.5 bg-slate-950/80 rounded-xl border border-cyan-500/30 p-1.5 focus-within:border-cyan-400 transition-colors">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type in Tamil, English, or Tanglish... (e.g. வணக்கம் / hi)"
          rows={1}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs resize-none outline-none max-h-20 py-1 px-1.5"
          disabled={isLoading || isRecording || transcribing}
        />

        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={isLoading || transcribing}
          className={`p-2 rounded-lg transition-all ${
            isRecording
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-pulse'
              : 'hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 border border-transparent hover:border-cyan-500/40'
          }`}
          title={isRecording ? 'Click to finish speaking' : 'Speak with VCamp (Push-to-talk)'}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading || isRecording}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white rounded-lg transition-colors shadow-sm"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
