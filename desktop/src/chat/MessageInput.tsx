import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { useConversationStore } from '../stores/conversationStore';
import { useCompanionStore } from '../stores/companionStore';
import { detectLanguage } from '../services/groqService';
import {
  generateCompanionReply,
  getSavedAIBaseUrl,
  getSavedAIProvider,
} from '../services/aiProviderService';
import { analyzeSentimentLocal } from '../services/sentimentService';
import {
  applySentimentAdaptation,
  evaluatePatternQuestionTrigger,
  markPatternQuestionShown,
} from '../services/sentimentAdaptation';
import { AudioRecordingService, transcribeAudioWithGroq } from '../services/transcriptionService';
import { speechService } from '../services/speechService';
import { reminderService } from '../services/reminderService';
import { moodTimelineService } from '../services/moodTimelineService';
import { userProfileService } from '../services/userProfileService';
import { questionEngineService } from '../services/questionEngineService';
import { apiClient } from '../services/apiClient';
import { animationController } from '../services/animationController';
import { detectChatAnimationIntent } from '../characters/animationMapping';

const recorder = new AudioRecordingService();

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { addMessage, messages, setIsLoading, setError, isLoading } = useConversationStore();
  const {
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

    setInput('');
    setStatusMessage(null);

    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    }

    const activeProfile = userProfileService.getActiveProfile();
    const consentSentiment = activeProfile.enableMoodTracking !== false;

    const localSentiment = analyzeSentimentLocal(textToSend);
    if (consentSentiment) {
      setSentiment(localSentiment.sentiment, localSentiment.confidence);
      moodTimelineService.recordMood(
        localSentiment.sentiment,
        localSentiment.confidence,
        textToSend
      );
      applySentimentAdaptation(textToSend, localSentiment.sentiment);
    }

    const parsedReminder = reminderService.parseNaturalLanguage(textToSend);
    if (parsedReminder) {
      reminderService.addReminder({
        title: parsedReminder.title,
        dueTime: parsedReminder.dueTime,
        priority: parsedReminder.priority,
      });
      setStatusMessage(
        `Reminder scheduled: "${parsedReminder.title}" at ${parsedReminder.dueTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      );
    }

    const userMsg = addMessage({
      role: 'user',
      content: textToSend,
      language: detectLanguage(textToSend),
      sentiment: consentSentiment ? localSentiment.sentiment : undefined,
      sentimentConfidence: consentSentiment ? localSentiment.confidence : undefined,
    });

    const chatIntent = detectChatAnimationIntent(textToSend);
    if (chatIntent) {
      animationController.trigger(chatIntent, { source: 'intent' });
    }

    setIsLoading(true);
    setState('thinking');

    try {
      let replyContent = '';
      let replyLanguage: 'ta' | 'en' | 'tanglish' = 'en';

      // Use enterprise backend when authenticated against backend server
      if (!apiClient.isLocalSession()) {
        try {
          const chatRes = await apiClient.post('/conversations/chat', {
            message: textToSend,
            ai_provider: getSavedAIProvider(),
            ai_model: groqModel,
            api_key: groqApiKey || undefined,
          });
          replyContent = chatRes.companion_message?.text || '';
          const lang = chatRes.companion_message?.language;
          replyLanguage = lang === 'ta' || lang === 'tanglish' ? lang : 'en';

          if (consentSentiment && chatRes.detected_emotion) {
            setSentiment(chatRes.detected_emotion, chatRes.confidence || 0.85);
            applySentimentAdaptation(textToSend, chatRes.detected_emotion);
          }
        } catch (backendErr) {
          console.warn('Backend chat fallback to modular local AI provider:', backendErr);
        }
      }

      if (!replyContent) {
        const provider = getSavedAIProvider();
        const baseUrl = getSavedAIBaseUrl();
        const response = await generateCompanionReply({
          provider,
          baseUrl,
          apiKey: groqApiKey,
          model: groqModel,
          systemPrompt,
          messages: [...messages, userMsg],
          detectedSentiment: localSentiment.sentiment,
        });
        replyContent = response.content;
        replyLanguage = response.language;
      }

      addMessage({
        role: 'assistant',
        content: replyContent,
        language: replyLanguage,
        sentiment: 'neutral',
      });

      // Check intelligent pattern-based question trigger (non-intrusive cooldown)
      const qConfig = questionEngineService.getConfig();
      const patternPrompt = evaluatePatternQuestionTrigger(
        activeProfile.enableQuestions && !qConfig.isPaused,
        false
      );
      if (patternPrompt) {
        markPatternQuestionShown();
        setStatusMessage(`Check-in: ${patternPrompt.text}`);
      }

      // TALK starts strictly when audio playback starts (onStart)
      if (autoSpeak) {
        const isExpressive = replyContent.length > 110 || /[!?]/.test(replyContent);
        speechService.speak(replyContent, {
          rate: speechRate,
          pitch: speechPitch,
          voiceName: speechVoice,
          expressive: isExpressive,
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
      const errMsg = err.message || 'Unable to generate companion response.';
      setError(errMsg);
      setState('confused');
      addMessage({
        role: 'assistant',
        content: `Error: ${errMsg}`,
        sentiment: 'confused',
      });
    } finally {
      animationController.onAIProcessingEnd();
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleVoice = async () => {
    if (isRecording) {
      try {
        setIsRecording(false);
        setTranscribing(true);
        setStatusMessage('Transcribing voice input...');
        setState('thinking');

        const audioBlob = await recorder.stopRecording();
        const transcription = await transcribeAudioWithGroq(audioBlob, groqApiKey);

        setTranscribing(false);
        setStatusMessage(null);

        if (transcription.text) {
          await handleSend(transcription.text);
        } else {
          setStatusMessage('No speech detected. Please try again.');
          animationController.onAIProcessingEnd();
          setState('idle');
        }
      } catch (err: any) {
        setTranscribing(false);
        setIsRecording(false);
        animationController.onAIProcessingEnd();
        setStatusMessage(`Voice error: ${err.message}`);
        setState('confused');
      }
    } else {
      try {
        if (!groqApiKey) {
          setStatusMessage('Configure a Groq API key in Settings to use Whisper voice transcription.');
          return;
        }
        if (isSpeaking) {
          speechService.stop();
          setIsSpeaking(false);
        }
        setStatusMessage('Listening... Click microphone again to send.');
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
    <div className="p-2.5 border-t border-vcamp-border bg-white">
      {(statusMessage || isRecording || transcribing) && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 mb-2 rounded-lg text-[11px] border ${
            isRecording
              ? 'bg-red-50 border-red-200 text-vcamp-error recording-pulse'
              : transcribing
              ? 'bg-vcamp-secondary border-blue-200 text-vcamp-primary'
              : 'bg-amber-50 border-amber-200 text-vcamp-warning'
          }`}
        >
          {isRecording ? (
            <span className="w-2 h-2 rounded-full bg-vcamp-error animate-ping inline-block mr-1" />
          ) : transcribing ? (
            <Loader2 className="w-3 h-3 animate-spin text-vcamp-primary shrink-0" />
          ) : (
            <AlertCircle className="w-3 h-3 shrink-0" />
          )}
          <span className="truncate">{statusMessage || 'Listening...'}</span>
        </div>
      )}

      <div className="flex items-end gap-1.5 bg-slate-50 rounded-xl border border-vcamp-border p-1.5 focus-within:border-vcamp-primary focus-within:bg-white transition-colors">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message VCamp (English, Tamil, or Tanglish)..."
          rows={1}
          data-testid="chat-input"
          className="flex-1 bg-transparent text-vcamp-text placeholder-vcamp-muted text-xs resize-none outline-none max-h-20 py-1.5 px-2"
          disabled={isLoading || isRecording || transcribing}
        />

        <button
          id="vcamp-mic-button"
          type="button"
          onClick={handleToggleVoice}
          disabled={isLoading || transcribing}
          className={`p-2 rounded-lg transition-colors ${
            isRecording
              ? 'bg-vcamp-error text-white'
              : 'hover:bg-vcamp-secondary text-vcamp-primary'
          }`}
          title={isRecording ? 'Finish recording' : 'Voice input'}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          type="button"
          data-testid="chat-send-btn"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading || isRecording}
          className="p-2 bg-vcamp-primary hover:bg-vcamp-primaryHover disabled:opacity-40 text-white rounded-lg transition-colors"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
