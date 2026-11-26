import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Clock, 
  Calendar, 
  X, 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  Loader2,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { reminderService, ReminderItem } from '../services/reminderService';
import { speechService } from '../services/speechService';
import { AudioRecordingService, transcribeAudioWithGroq } from '../services/transcriptionService';
import { useCompanionStore } from '../stores/companionStore';

interface ReminderBubbleProps {
  reminder: ReminderItem;
  onClose?: () => void;
}

export const ReminderBubble: React.FC<ReminderBubbleProps> = ({ reminder, onClose }) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [inputText, setInputText] = useState('');

  // Voice command state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  const recordingServiceRef = useRef<AudioRecordingService | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { groqApiKey } = useCompanionStore();

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

  const handleDone = () => {
    reminderService.completeReminder(reminder.id);
    onClose?.();
  };

  const handleSnooze = (minutes: number) => {
    reminderService.snoozeReminder(reminder.id, minutes);
    onClose?.();
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTime) return;
    const isoDate = new Date(rescheduleTime).toISOString();
    reminderService.rescheduleReminder(reminder.id, isoDate);
    onClose?.();
  };

  const handleDismiss = () => {
    reminderService.dismissReminder(reminder.id);
    onClose?.();
  };

  const handleToggleVoice = async () => {
    if (isTranscribing) return;

    if (isRecording) {
      // Stop recording and transcribe
      setIsRecording(false);
      setIsTranscribing(true);

      try {
        const audioBlob = await recordingServiceRef.current?.stopRecording();
        if (audioBlob && audioBlob.size > 0) {
          const transcription = await transcribeAudioWithGroq(audioBlob, groqApiKey);
          const transcriptText = transcription?.text?.trim() || '';
          if (transcriptText) {
            const result = reminderService.handleVoiceCommand(transcriptText, reminder.id);
            if (result.handled) {
              setVoiceFeedback(result.feedback || 'Command processed.');
              setTimeout(() => {
                onClose?.();
              }, 1200);
            } else {
              setVoiceFeedback(`Heard: "${transcriptText}". Say "Done" or "Snooze".`);
            }
          }
        }
      } catch (err) {
        console.error('Reminder voice recognition error:', err);
        setVoiceFeedback('Could not hear clearly. Please try again.');
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        // Halt any speaking before recording
        speechService.stop();
        recordingServiceRef.current = new AudioRecordingService();
        await recordingServiceRef.current.startRecording();
        setIsRecording(true);
        setVoiceFeedback(null);
      } catch (err) {
        console.error('Failed to start microphone:', err);
        setVoiceFeedback('Microphone unavailable.');
      }
    }
  };

  const handleTextInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const result = reminderService.handleVoiceCommand(inputText.trim(), reminder.id);
    if (result.handled) {
      setVoiceFeedback(result.feedback || 'Handled!');
      setTimeout(() => {
        onClose?.();
      }, 1000);
    } else {
      setVoiceFeedback('Try: "done", "snooze 10 mins", or "dismiss"');
    }
    setInputText('');
  };

  const formattedDueTime = new Date(reminder.dueTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="relative flex flex-col z-40 vcamp-card border-2 border-vcamp-primary rounded-2xl p-4 select-none text-vcamp-text max-w-sm w-80 sm:w-88"
    >
      <div 
        className="absolute -left-2.5 bottom-8 w-4 h-4 bg-white border-b-2 border-l-2 border-vcamp-primary transform rotate-45"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-vcamp-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-vcamp-secondary flex items-center justify-center text-vcamp-primary">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-vcamp-text">
            Due Reminder
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
            reminder.priority === 'high' 
              ? 'bg-red-50 text-vcamp-error border border-red-200' 
              : reminder.priority === 'medium'
              ? 'bg-vcamp-secondary text-vcamp-primary border border-blue-200'
              : 'bg-slate-100 text-vcamp-muted'
          }`}>
            {reminder.priority}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-vcamp-muted font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-vcamp-primary" />
            {formattedDueTime}
          </span>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-vcamp-muted hover:text-vcamp-text hover:bg-slate-100 transition-colors ml-1"
            title="Dismiss Reminder"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reminder Title */}
      <div className="mb-2">
        <h3 className="text-sm font-bold text-vcamp-text leading-snug line-clamp-2">
          {reminder.title}
        </h3>
        {reminder.description && (
          <p className="text-[11px] text-vcamp-muted mt-1 line-clamp-2">
            {reminder.description}
          </p>
        )}
      </div>

      {/* Conversational Spoken Announcement */}
      <div className="bg-vcamp-secondary border border-blue-200 rounded-xl p-2.5 mb-3 text-[11px] text-vcamp-text flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-vcamp-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="leading-relaxed">
            "{reminder.conversationalPrompt || `Hey! It's time for ${reminder.title}. Shall we mark it done or snooze?`}"
          </p>
        </div>
        <button
          onClick={() => {
            speechService.speak(reminder.conversationalPrompt || reminder.title);
          }}
          className="text-vcamp-muted hover:text-vcamp-primary p-1"
          title="Re-play voice announcement"
        >
          <Volume2 className="w-3 h-3" />
        </button>
      </div>

      {voiceFeedback && (
        <div className="mb-2 px-2.5 py-1 rounded-lg bg-vcamp-secondary border border-blue-200 text-[10px] text-vcamp-primary font-medium flex items-center justify-between">
          <span>{voiceFeedback}</span>
          <button onClick={() => setVoiceFeedback(null)} className="text-vcamp-muted hover:text-vcamp-text">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {isRescheduling ? (
        <form onSubmit={handleRescheduleSubmit} className="mb-3 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-vcamp-border">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-vcamp-text flex items-center gap-1">
              <Calendar className="w-3 h-3 text-vcamp-primary" />
              Pick New Time:
            </span>
            <button 
              type="button" 
              onClick={() => setIsRescheduling(false)}
              className="text-vcamp-muted hover:text-vcamp-text text-[10px]"
            >
              Cancel
            </button>
          </div>
          <input
            type="datetime-local"
            value={rescheduleTime}
            onChange={(e) => setRescheduleTime(e.target.value)}
            required
            className="w-full bg-white border border-vcamp-border rounded-lg px-2 py-1 text-xs text-vcamp-text"
          />
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-vcamp-primary hover:bg-vcamp-primaryHover text-white text-xs font-semibold"
          >
            Confirm Reschedule
          </button>
        </form>
      ) : (
        <div className="space-y-2 mb-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDone}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-vcamp-success font-bold text-xs transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Done</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-vcamp-secondary hover:bg-blue-100 border border-blue-200 text-vcamp-primary font-bold text-xs transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Snooze</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showSnoozeOptions && (
                <div className="absolute right-0 bottom-full mb-1 w-full vcamp-card rounded-xl p-1 z-50 space-y-1">
                  {[
                    { label: '5 minutes', mins: 5 },
                    { label: '15 minutes', mins: 15 },
                    { label: '30 minutes', mins: 30 },
                    { label: '1 hour', mins: 60 },
                  ].map((s) => (
                    <button
                      key={s.mins}
                      onClick={() => handleSnooze(s.mins)}
                      className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-vcamp-secondary text-vcamp-text text-xs font-medium"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
            <button
              onClick={() => setIsRescheduling(true)}
              className="text-vcamp-muted hover:text-vcamp-primary font-medium flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              <span>Reschedule...</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-vcamp-muted hover:text-vcamp-error font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleTextInputSubmit} className="pt-2 border-t border-vcamp-border flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={isTranscribing}
          className={`p-1.5 rounded-xl border flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-50 border-vcamp-error text-vcamp-error animate-pulse'
              : 'bg-white border-vcamp-border text-vcamp-primary hover:bg-vcamp-secondary'
          }`}
          title={isRecording ? "Stop voice listening" : "Speak voice command"}
        >
          {isTranscribing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isRecording ? (
            <Square className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRecording ? `Listening (${recordingSeconds}s)...` : "Say or type: 'done', 'snooze 15m'..."}
          className="flex-1 bg-slate-50 border border-vcamp-border rounded-xl px-2.5 py-1 text-xs text-vcamp-text placeholder-vcamp-muted focus:outline-none focus:border-vcamp-primary focus:bg-white"
        />

        <button
          type="submit"
          className="p-1.5 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white transition-colors"
          title="Send command"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
