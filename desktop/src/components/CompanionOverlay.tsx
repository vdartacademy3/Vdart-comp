import React, { useState, useEffect } from 'react';
import { CompanionScene } from '../companion/CompanionScene';
import { ChatWindow } from '../chat/ChatWindow';
import { QuestionBubble } from '../companion/QuestionBubble';
import { ReminderBubble } from '../companion/ReminderBubble';
import { AuthModal } from './AuthModal';
import { MinimalSettingsModal } from './MinimalSettingsModal';
import { useCompanionStore } from '../stores/companionStore';
import { useAuthStore } from '../stores/authStore';
import { useResponsiveDimensions } from '../hooks/useResponsiveDimensions';
import { reminderService, ReminderItem } from '../services/reminderService';
import { questionEngineService } from '../services/questionEngineService';
import { speechService } from '../services/speechService';
import { 
  MessageSquare, 
  Minimize2, 
  Move, 
  Mic, 
  Moon, 
  Bell,
  Check,
  Clock,
  X,
  HelpCircle,
  Pause,
  Play,
  Power,
  Sliders,
  ExternalLink,
  LogOut,
  Timer
} from 'lucide-react';

export const CompanionOverlay: React.FC = () => {
  const { 
    state, 
    currentAction,
    triggerAction,
    isSleeping,
    setIsSleeping,
    isChatOpen, 
    setIsChatOpen, 
    isRecording,
    isSpeaking
  } = useCompanionStore();

  const { isAuthenticated, employee, checkAuth, logout } = useAuthStore();

  const [isHovered, setIsHovered] = useState(false);
  const [activeAlert, setActiveAlert] = useState<ReminderItem | null>(null);
  const [isMinimalSettingsOpen, setIsMinimalSettingsOpen] = useState(false);
  
  // Question Engine State
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [isQuestionPaused, setIsQuestionPaused] = useState(false);
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(120);

  // Reminders Popover State
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<ReminderItem[]>([]);

  // Right-click Context Menu State
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const dimensions = useResponsiveDimensions(isChatOpen, false, isQuestionActive, Boolean(activeAlert));

  const isTauri = typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

  useEffect(() => {
    // Check initial employee authentication state
    checkAuth();

    const unsubAlert = reminderService.onAlert((alert) => {
      setActiveAlert(alert);
    });

    const unsubReminders = reminderService.subscribe((items) => {
      setPendingReminders(items.filter((r) => r.status === 'pending' || r.status === 'snoozed'));
    });

    const unsubQuestion = questionEngineService.subscribe((qState) => {
      setIsQuestionActive(Boolean(qState.question || qState.followUp || qState.isThinking));
      setIsQuestionPaused(qState.isPaused);
      setIsAutoEnabled(qState.isAutoEnabled);
      setSecondsUntilNext(qState.secondsUntilNext);
    });

    // Update countdown timer every second
    const countdownTimer = setInterval(() => {
      setSecondsUntilNext(questionEngineService.getSecondsUntilNext());
    }, 1000);

    // Close context menu on outside click
    const handleOutsideClick = () => {
      setContextMenuPos(null);
    };
    window.addEventListener('click', handleOutsideClick);

    return () => {
      unsubAlert();
      unsubReminders();
      unsubQuestion();
      clearInterval(countdownTimer);
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleMinimizeToTray = async () => {
    setContextMenuPos(null);
    try {
      if (isTauri) {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const win = getCurrentWebviewWindow();
        await win.hide();
      }
    } catch {
      // Fallback in browser preview
    }
  };

  const handleExitApp = async () => {
    try {
      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('exit_vcamp');
      }
    } catch {}
  };

  const handleToggleChat = () => {
    setContextMenuPos(null);
    setIsRemindersOpen(false);
    setIsMinimalSettingsOpen(false);
    setIsChatOpen(!isChatOpen);
  };

  const handleToggleVoice = () => {
    setContextMenuPos(null);
    if (!isChatOpen) setIsChatOpen(true);
    // Voice activation trigger
    const micBtn = document.getElementById('vcamp-mic-button');
    if (micBtn) micBtn.click();
  };

  const handleRobotClick = () => {
    if (isSpeaking) {
      speechService.stop();
    }
    if (isSleeping) {
      setIsSleeping(false);
      triggerAction('greet', 2000);
    } else {
      handleToggleChat();
    }
  };

  const handleRobotContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleTriggerQuestion = () => {
    setContextMenuPos(null);
    setIsRemindersOpen(false);
    if (isChatOpen) setIsChatOpen(false);
    if (isSpeaking) speechService.stop();
    questionEngineService.triggerQuestion(true);
  };

  const handleTogglePauseQuestions = () => {
    setContextMenuPos(null);
    const newPaused = questionEngineService.togglePause();
    setIsQuestionPaused(newPaused);
  };

  const handleToggleAutoEnabled = () => {
    setContextMenuPos(null);
    const newAuto = questionEngineService.toggleAutoEnabled();
    setIsAutoEnabled(newAuto);
  };

  const handleToggleReminders = () => {
    setContextMenuPos(null);
    setIsMinimalSettingsOpen(false);
    setIsRemindersOpen((prev) => !prev);
  };

  const handleOpenWebDashboard = () => {
    setContextMenuPos(null);
    window.open('http://localhost:5173', '_blank');
  };

  // Minimal Actions Header (Zero manual movement buttons)
  const renderHeader = () => (
    <div 
      data-tauri-drag-region
      className={`h-8 flex items-center justify-between px-1.5 cursor-move z-40 transition-opacity duration-200 select-none ${
        isHovered || activeAlert || isRemindersOpen ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ width: `${dimensions.robotWidth}px` }}
      title="Drag to reposition companion • Right-click for quick menu"
    >
      <div 
        data-tauri-drag-region
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 border border-cyan-500/30 text-[9px] text-cyan-300 pointer-events-none"
      >
        <Move className="w-2.5 h-2.5 text-cyan-400" />
        <span className="font-semibold">VCamp</span>
      </div>

      <div className="flex items-center gap-0.5 bg-slate-950/90 border border-cyan-500/30 rounded-full px-1.5 py-0.5 shadow-lg">
        {/* 1. Chat */}
        <button
          onClick={handleToggleChat}
          className={`p-1 transition-colors rounded ${isChatOpen ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-cyan-300'}`}
          title="Chat (Open conversation)"
        >
          <MessageSquare className="w-3 h-3" />
        </button>

        {/* 2. Voice Mic */}
        <button
          onClick={handleToggleVoice}
          className="p-1 transition-colors rounded text-slate-400 hover:text-cyan-300"
          title="Voice interaction"
        >
          <Mic className="w-3 h-3" />
        </button>

        {/* 3. Ask Me Question */}
        <button
          onClick={handleTriggerQuestion}
          className={`p-1 transition-colors rounded ${isQuestionActive ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-cyan-300'}`}
          title={`Ask Me a Question (${secondsUntilNext}s)`}
        >
          <HelpCircle className="w-3 h-3" />
        </button>

        {/* 4. Reminders */}
        <button
          onClick={handleToggleReminders}
          className={`p-1 transition-colors rounded relative ${isRemindersOpen ? 'text-amber-400 bg-amber-950/50' : 'text-slate-400 hover:text-cyan-300'}`}
          title="Pending Reminders"
        >
          <Bell className="w-3 h-3" />
          {pendingReminders.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          )}
        </button>

        {/* 5. Minimal Settings */}
        <button
          onClick={() => setIsMinimalSettingsOpen(true)}
          className="p-1 hover:text-cyan-300 text-slate-400 transition-colors rounded"
          title="Account & Minimal Settings"
        >
          <Sliders className="w-3 h-3" />
        </button>

        {/* 6. Minimize */}
        <button
          onClick={handleMinimizeToTray}
          className="p-1 hover:text-white text-slate-400 transition-colors rounded"
          title="Minimize to System Tray"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  // 3D Robot Viewport with HUD Alerts and State Indicator
  const renderRobotViewport = () => (
    <div 
      style={{ width: `${dimensions.robotWidth}px`, height: `${dimensions.robotHeight}px` }}
      className="relative shrink-0 flex items-center justify-center cursor-pointer select-none p-1.5"
      onClick={handleRobotClick}
      onContextMenu={handleRobotContextMenu}
      title={isSleeping ? "Click to wake VCamp up • Right-click for options" : "Click to chat • Right-click for options"}
    >
      {/* Floating Reminders Quick Drawer */}
      {isRemindersOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-44 left-0 right-0 z-50 bg-slate-950/95 border border-cyan-500/50 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-2 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
            <span className="font-semibold text-cyan-300 text-[11px] flex items-center gap-1">
              <Bell className="w-3 h-3 text-cyan-400" />
              Pending Reminders ({pendingReminders.length})
            </span>
            <button onClick={() => setIsRemindersOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-0.5">
            {pendingReminders.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-2">No pending reminders.</p>
            ) : (
              pendingReminders.map((r) => (
                <div key={r.id} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-[10px] truncate font-medium">{r.title}</p>
                    <span className="text-[9px] text-cyan-400">{new Date(r.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button 
                      onClick={() => reminderService.completeReminder(r.id)}
                      className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                      title="Mark Complete"
                    >
                      <Check className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => reminderService.snoozeReminder(r.id, 10)}
                      className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                      title="Snooze 10m"
                    >
                      <Clock className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3D Scene Viewport */}
      <CompanionScene />

      {/* Floating Status Pill under the robot */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none z-30 whitespace-nowrap">
        <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1.5 shadow-lg border backdrop-blur-sm transition-all duration-300 ${
          isRecording
            ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 animate-pulse'
            : isSpeaking
            ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50'
            : isSleeping || state === 'sleep'
            ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40'
            : state === 'thinking' || currentAction === 'think'
            ? 'bg-purple-950/90 text-purple-300 border-purple-500/50'
            : isHovered
            ? 'bg-slate-950/85 text-cyan-400 border-cyan-500/40 opacity-100'
            : 'opacity-0'
        }`}>
          {isRecording ? (
            <>
              <Mic className="w-2.5 h-2.5 text-rose-400 animate-ping" />
              <span>Listening...</span>
            </>
          ) : isSpeaking ? (
            <span>Speaking...</span>
          ) : isSleeping || state === 'sleep' ? (
            <>
              <Moon className="w-2.5 h-2.5 text-indigo-400" />
              <span>Resting</span>
            </>
          ) : state === 'thinking' || currentAction === 'think' ? (
            <span>Thinking...</span>
          ) : employee ? (
            <span>{employee.full_name}</span>
          ) : (
            <span>VCamp Active</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="w-full h-full relative flex flex-col justify-end select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mandatory Authentication Gate */}
      {!isAuthenticated && (
        <AuthModal onSuccess={() => {}} />
      )}

      {/* Minimal Settings Modal */}
      {isMinimalSettingsOpen && (
        <MinimalSettingsModal onClose={() => setIsMinimalSettingsOpen(false)} />
      )}

      {/* Tauri Native Window Layout */}
      {isTauri ? (
        <div className="w-full h-full flex flex-col justify-end">
          {renderHeader()}

          <div className="flex items-end gap-3 w-full">
            {renderRobotViewport()}

            {/* Interactive Reminder Conversation Bubble anchored beside robot */}
            {activeAlert && !isChatOpen && (
              <ReminderBubble 
                reminder={activeAlert}
                onClose={() => setActiveAlert(null)}
              />
            )}

            {/* Desktop Robot Speech Bubble for Questions */}
            {!activeAlert && isQuestionActive && !isChatOpen && (
              <QuestionBubble onClose={() => setIsQuestionActive(false)} />
            )}

            {/* Chat Window */}
            {isChatOpen && (
              <ChatWindow 
                style={{ width: `${dimensions.chatWidth}px`, height: `${dimensions.chatHeight}px` }}
              />
            )}
          </div>
        </div>
      ) : (
        /* Browser Preview Fallback */
        <div className="fixed bottom-6 left-6 flex flex-col items-start gap-1 z-40">
          {renderHeader()}

          <div className="flex items-end gap-3">
            {renderRobotViewport()}

            {/* Interactive Reminder Conversation Bubble */}
            {activeAlert && !isChatOpen && (
              <ReminderBubble 
                reminder={activeAlert}
                onClose={() => setActiveAlert(null)}
              />
            )}

            {/* Question Bubble */}
            {!activeAlert && isQuestionActive && !isChatOpen && (
              <QuestionBubble onClose={() => setIsQuestionActive(false)} />
            )}

            {/* Chat Window */}
            {isChatOpen && (
              <ChatWindow 
                style={{ width: `${dimensions.chatWidth}px`, height: `${dimensions.chatHeight}px` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Right-Click Context Menu (Zero manual movement controls) */}
      {contextMenuPos && (
        <div 
          className="fixed z-50 bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl p-1.5 w-48 text-xs backdrop-blur-xl animate-in fade-in"
          style={{
            left: `${Math.min(contextMenuPos.x, window.innerWidth - 200)}px`,
            top: `${Math.max(10, contextMenuPos.y - 280)}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-cyan-400 border-b border-cyan-500/20 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>VCamp Companion</span>
            {employee && <span className="text-emerald-400 text-[9px] font-medium">{employee.role}</span>}
          </div>

          <button
            onClick={handleToggleChat}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-950/50 text-slate-200 hover:text-cyan-300 text-left transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Chat – Conversation</span>
          </button>

          <button
            onClick={handleToggleVoice}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-950/50 text-slate-200 hover:text-cyan-300 text-left transition-colors"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Voice – Interaction</span>
          </button>

          <button
            onClick={handleTriggerQuestion}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-cyan-950/50 text-slate-200 hover:text-cyan-300 text-left transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Ask Me Question</span>
            </div>
            {secondsUntilNext >= 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
                {secondsUntilNext}s
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setIsRemindersOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-950/50 text-slate-200 hover:text-amber-300 text-left transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>4. Reminders</span>
          </button>

          <button
            onClick={() => {
              setIsSleeping(!isSleeping);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-950/50 text-slate-200 hover:text-indigo-300 text-left transition-colors"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>5. Sleep – Idle Mode</span>
          </button>

          <button
            onClick={() => {
              setIsMinimalSettingsOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-950/50 text-slate-200 hover:text-cyan-300 text-left transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>6. Preferences & Account</span>
          </button>

          <button
            onClick={handleOpenWebDashboard}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-950/50 text-slate-200 hover:text-cyan-300 text-left transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>7. Open Web Dashboard</span>
          </button>

          <button
            onClick={async () => {
              setContextMenuPos(null);
              await logout();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-rose-950/50 text-slate-200 hover:text-rose-400 text-left transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>8. Sign Out</span>
          </button>

          <div className="my-1 border-t border-cyan-500/20" />

          <button
            onClick={handleMinimizeToTray}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-left transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Hide to Tray</span>
          </button>

          <button
            onClick={handleExitApp}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-rose-950/50 text-slate-200 hover:text-rose-400 text-left transition-colors mt-0.5"
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit VCamp</span>
          </button>
        </div>
      )}
    </div>
  );
};
