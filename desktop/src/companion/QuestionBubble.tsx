import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  Square, 
  Clock, 
  SkipForward, 
  X, 
  Check, 
  Loader2, 
  Volume2, 
  Brain,
  HelpCircle,
  Flame,
  Heart,
  Smile,
  Compass
} from 'lucide-react';
import { questionEngineService } from '../services/questionEngineService';
import { QuestionItem } from '../services/questionBankService';
import { AudioRecordingService, transcribeAudioWithGroq } from '../services/transcriptionService';
import { useCompanionStore } from '../stores/companionStore';

interface QuestionBubbleProps {
  onClose?: () => void;
}

export const QuestionBubble: React.FC<QuestionBubbleProps> = ({ onClose }) => {
  const [question, setQuestion] = useState<QuestionItem | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [freeformText, setFreeformText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const recordingServiceRef = useRef<AudioRecordingService | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { groqApiKey } = useCompanionStore();

  useEffect(() => {
    const unsub = questionEngineService.subscribe((state) => {
      setQuestion(state.question);
      setFollowUp(state.followUp);
      setIsThinking(state.isThinking);
      if (state.question && !state.followUp) {
        setFreeformText('');
      }
    });

    return () => unsub();
  }, []);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  if (!question && !followUp && !isThinking) {
    return null;
  }

  const handleSelectOption = (key: string, text: string) => {
    if (isThinking) return;
    useCompanionStore.getState().setEmotion('thinking');
    questionEngineService.submitAnswer(text, key);
  };

  const handleSendFreeform = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!freeformText.trim() || isThinking) return;
    useCompanionStore.getState().setEmotion('thinking');
    questionEngineService.submitAnswer(freeformText.trim());
    setFreeformText('');
  };

  const handleToggleVoice = async () => {
    if (isTranscribing || isThinking) return;

    if (isRecording) {
      // Stop recording and transcribe with Groq Whisper
      setIsRecording(false);
      useCompanionStore.getState().setIsRecording(false);
      useCompanionStore.getState().setEmotion('thinking');
      setIsTranscribing(true);
      try {
        if (!recordingServiceRef.current) {
          throw new Error('No active recorder');
        }
        const audioBlob = await recordingServiceRef.current.stopRecording();
        const transcription = await transcribeAudioWithGroq(audioBlob, groqApiKey);
        if (transcription.text && transcription.text.trim()) {
          setFreeformText(transcription.text.trim());
          // Auto submit spoken answer
          await questionEngineService.submitAnswer(transcription.text.trim());
        }
      } catch (err: any) {
        console.error('Speech transcription error:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        if (!recordingServiceRef.current) {
          recordingServiceRef.current = new AudioRecordingService();
        }
        await recordingServiceRef.current.startRecording();
        setIsRecording(true);
        useCompanionStore.getState().setIsRecording(true);
        useCompanionStore.getState().setEmotion('listening');
      } catch (err: any) {
        console.error('Failed to start mic:', err);
      }
    }
  };

  const handleSkip = () => {
    if (isRecording && recordingServiceRef.current) {
      recordingServiceRef.current.cancelRecording();
      setIsRecording(false);
    }
    questionEngineService.skip();
    if (onClose) onClose();
  };

  const handleSnooze = () => {
    if (isRecording && recordingServiceRef.current) {
      recordingServiceRef.current.cancelRecording();
      setIsRecording(false);
    }
    questionEngineService.snooze(15);
    if (onClose) onClose();
  };

  const handleDismiss = () => {
    if (isRecording && recordingServiceRef.current) {
      recordingServiceRef.current.cancelRecording();
      setIsRecording(false);
    }
    questionEngineService.dismiss();
    if (onClose) onClose();
  };

  // Category Icon helper
  const renderCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('stress') || c.includes('pressure') || c.includes('workload')) {
      return <Flame className="w-3 h-3 text-amber-400" />;
    }
    if (c.includes('wellbeing') || c.includes('balance') || c.includes('support')) {
      return <Heart className="w-3 h-3 text-rose-400" />;
    }
    if (c.includes('motivation') || c.includes('satisfaction') || c.includes('goals')) {
      return <Smile className="w-3 h-3 text-emerald-400" />;
    }
    return <Compass className="w-3 h-3 text-cyan-400" />;
  };

  return (
    <div 
      className="relative z-50 flex flex-col w-[320px] sm:w-[350px] vcamp-card rounded-2xl p-3.5 transition-all duration-200 select-none text-vcamp-text"
    >
      {/* Pointed Speech Bubble Tail Pointing Left to Companion */}
      <div 
        className="absolute top-10 -left-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-slate-200 pointer-events-none" 
      />
      <div 
        className="absolute top-10 -left-[7px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-white pointer-events-none" 
      />

      {/* Header: Category Badge and Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-vcamp-border">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-vcamp-secondary border border-blue-200">
          {question ? renderCategoryIcon(question.category) : <Sparkles className="w-3 h-3 text-vcamp-primary" />}
          <span className="text-[10px] font-semibold text-vcamp-primary tracking-wide uppercase">
            {question ? question.category : 'VCamp Check-in'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-vcamp-muted">
          {!followUp && (
            <>
              <button
                onClick={handleSnooze}
                className="p-1 rounded-md hover:text-vcamp-primary hover:bg-vcamp-secondary transition-colors"
                title="Snooze for 15 minutes"
              >
                <Clock className="w-3 h-3" />
              </button>
              <button
                onClick={handleSkip}
                className="p-1 rounded-md hover:text-vcamp-primary hover:bg-vcamp-secondary transition-colors"
                title="Skip this question"
              >
                <SkipForward className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:text-vcamp-text hover:bg-slate-100 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Area */}
      {followUp ? (
        <div className="space-y-2.5 py-1">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-vcamp-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
              V
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-vcamp-primary uppercase tracking-wider block mb-0.5">
                VCamp
              </span>
              <p className="text-xs text-vcamp-text font-medium leading-relaxed">
                {followUp}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-vcamp-border">
            <span className="text-[10px] text-vcamp-muted flex items-center gap-1">
              <Check className="w-3 h-3 text-vcamp-success" />
              <span>Saved with your consent</span>
            </span>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1 rounded-lg bg-vcamp-primary hover:bg-vcamp-primaryHover text-white text-[10px] font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : isThinking ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
          <Loader2 className="w-6 h-6 text-vcamp-primary animate-spin" />
          <p className="text-xs font-medium text-vcamp-text">Processing your response...</p>
        </div>
      ) : question ? (
        <div className="space-y-2.5">
          <p className="text-xs sm:text-[13px] font-semibold text-vcamp-text leading-snug">
            {question.text}
          </p>

          {question.options && Object.keys(question.options).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {Object.entries(question.options).map(([key, optText]) => (
                <button
                  key={key}
                  onClick={() => handleSelectOption(key, optText)}
                  className="flex items-start gap-1.5 p-2 rounded-xl bg-slate-50 border border-vcamp-border hover:border-vcamp-primary hover:bg-vcamp-secondary text-left transition-all group"
                >
                  <span className="w-4 h-4 rounded-md bg-white group-hover:bg-vcamp-primary text-vcamp-primary group-hover:text-white font-bold text-[10px] flex items-center justify-center shrink-0 border border-vcamp-border">
                    {key}
                  </span>
                  <span className="text-[11px] text-vcamp-text leading-tight font-medium">
                    {optText}
                  </span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendFreeform} className="flex items-center gap-1.5 pt-1">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={freeformText}
                onChange={(e) => setFreeformText(e.target.value)}
                placeholder={isRecording ? `Listening (${recordingSeconds}s)...` : "Answer or skip..."}
                disabled={isRecording || isTranscribing}
                className={`w-full bg-slate-50 border rounded-xl px-2.5 py-1.5 text-xs text-vcamp-text placeholder-vcamp-muted focus:outline-none transition-colors ${
                  isRecording
                    ? 'border-vcamp-error bg-red-50'
                    : 'border-vcamp-border focus:border-vcamp-primary focus:bg-white'
                }`}
              />
              {isTranscribing && (
                <div className="absolute right-2 top-2">
                  <Loader2 className="w-3.5 h-3.5 text-vcamp-primary animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={isTranscribing}
              className={`p-1.5 rounded-xl border transition-all ${
                isRecording
                  ? 'bg-vcamp-error text-white border-vcamp-error animate-pulse'
                  : 'bg-white border-vcamp-border text-vcamp-primary hover:bg-vcamp-secondary'
              }`}
              title={isRecording ? "Stop recording" : "Speak answer"}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="submit"
              disabled={!freeformText.trim() || isRecording || isTranscribing}
              className="p-1.5 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white disabled:opacity-40 transition-all"
              title="Submit answer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
};
