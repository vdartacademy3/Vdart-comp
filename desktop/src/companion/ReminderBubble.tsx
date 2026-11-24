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
      className="relative flex flex-col z-40 bg-slate-950/95 border-2 border-cyan-400/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-left-3 duration-300 select-none text-slate-100 max-w-sm w-80 sm:w-88"
      style={{
        boxShadow: '0 0 25px rgba(0, 242, 254, 0.25), 0 15px 35px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Pointed Speech Bubble Tail pointing left toward the 3D robot */}
      <div 
        className="absolute -left-2.5 bottom-8 w-4 h-4 bg-slate-950 border-b-2 border-l-2 border-cyan-400/80 transform rotate-45"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Due Reminder
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
            reminder.priority === 'high' 
              ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50' 
              : reminder.priority === 'medium'
              ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400'
          }`}>
            {reminder.priority}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            {formattedDueTime}
          </span>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ml-1"
            title="Dismiss Reminder"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reminder Title */}
      <div className="mb-2">
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
          {reminder.title}
        </h3>
        {reminder.description && (
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
            {reminder.description}
          </p>
        )}
      </div>

      {/* Conversational Spoken Announcement from VCamp */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2.5 mb-3 text-[11px] text-cyan-200/90 italic flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="leading-relaxed">
            "{reminder.conversationalPrompt || `Hey! It's time for ${reminder.title}. Shall we mark it done or snooze?`}"
          </p>
        </div>
        <button
          onClick={() => {
            speechService.speak(reminder.conversationalPrompt || reminder.title);
          }}
          className="text-slate-400 hover:text-cyan-300 p-1"
          title="Re-play voice announcement"
        >
          <Volume2 className="w-3 h-3" />
        </button>
      </div>

      {/* Voice / Text Feedback Notification */}
      {voiceFeedback && (
        <div className="mb-2 px-2.5 py-1 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-[10px] text-cyan-300 font-medium flex items-center justify-between">
          <span>{voiceFeedback}</span>
          <button onClick={() => setVoiceFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Reschedule Inline Form (if open) */}
      {isRescheduling ? (
        <form onSubmit={handleRescheduleSubmit} className="mb-3 space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-cyan-300 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Pick New Time:
            </span>
            <button 
              type="button" 
              onClick={() => setIsRescheduling(false)}
              className="text-slate-400 hover:text-white text-[10px]"
            >
              Cancel
            </button>
          </div>
          <input
            type="datetime-local"
            value={rescheduleTime}
            onChange={(e) => setRescheduleTime(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
          />
          <button
            type="submit"
            className="w-full py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Confirm Reschedule
          </button>
        </form>
      ) : (
        /* Action Buttons */
        <div className="space-y-2 mb-2">
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Mark Done Button */}
            <button
              onClick={handleDone}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/45 border border-emerald-500/50 text-emerald-200 font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>Done</span>
            </button>

            {/* 2. Snooze Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 font-bold text-xs transition-all active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Snooze</span>
                <ChevronDown className="w-3 h-3 text-cyan-400 ml-0.5" />
              </button>

              {/* Snooze Submenu */}
              {showSnoozeOptions && (
                <div className="absolute right-0 bottom-full mb-1 w-full bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl p-1 z-50 space-y-1">
                  {[
                    { label: '5 minutes', mins: 5 },
                    { label: '15 minutes', mins: 15 },
                    { label: '30 minutes', mins: 30 },
                    { label: '1 hour', mins: 60 },
                  ].map((s) => (
                    <button
                      key={s.mins}
                      onClick={() => handleSnooze(s.mins)}
                      className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-cyan-950 text-cyan-300 text-xs font-medium"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Reschedule & Dismiss row */}
          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
            <button
              onClick={() => setIsRescheduling(true)}
              className="text-slate-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Calendar className="w-3 h-3" />
              <span>Reschedule...</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-rose-300 font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Voice & Quick Text Input Bar */}
      <form onSubmit={handleTextInputSubmit} className="pt-2 border-t border-cyan-500/20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={isTranscribing}
          className={`p-1.5 rounded-xl border flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950'
          }`}
          title={isRecording ? "Stop voice listening" : "Speak voice command (e.g. 'Done' or 'Snooze 10 mins')"}
        >
          {isTranscribing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : isRecording ? (
            <Square className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
          )}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRecording ? `Listening (${recordingSeconds}s)...` : "Say or type: 'done', 'snooze 15m'..."}
          className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />

        <button
          type="submit"
          className="p-1.5 rounded-xl bg-cyan-600/40 hover:bg-cyan-600 text-cyan-200 border border-cyan-500/50 transition-colors"
          title="Send command"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
