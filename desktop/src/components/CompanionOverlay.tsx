import React, { useState, useEffect } from 'react';
import { CompanionScene } from '../companion/CompanionScene';
import { ChatWindow } from '../chat/ChatWindow';
import { QuestionBubble } from '../companion/QuestionBubble';
import { ReminderBubble } from '../companion/ReminderBubble';
import { AuthModal } from './AuthModal';
import { MinimalSettingsModal } from './MinimalSettingsModal';
import { DashboardModal } from '../dashboard/DashboardModal';
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
  Power,
  Sliders,
  Maximize2,
  LogOut,
  Users,
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
    isDashboardOpen,
    setIsDashboardOpen,
    openCharacterStudio,
    isRecording,
    isSpeaking,
  } = useCompanionStore();

  const { isAuthenticated, employee, checkAuth, logout } = useAuthStore();

  const [isHovered, setIsHovered] = useState(false);
  const [activeAlert, setActiveAlert] = useState<ReminderItem | null>(null);
  const [isMinimalSettingsOpen, setIsMinimalSettingsOpen] = useState(false);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<ReminderItem[]>([]);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const dimensions = useResponsiveDimensions(
    isChatOpen,
    isDashboardOpen,
    isQuestionActive,
    Boolean(activeAlert),
    {
      isAuthOpen: !isAuthenticated,
      isMinimalSettingsOpen,
      isContextMenuOpen: Boolean(contextMenuPos),
      isRemindersOpen,
    }
  );

  const isTauri =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

  useEffect(() => {
    checkAuth();

    const unsubAlert = reminderService.onAlert((alert) => setActiveAlert(alert));
    const unsubReminders = reminderService.subscribe((items) => {
      setPendingReminders(items.filter((r) => r.status === 'pending' || r.status === 'snoozed'));
    });
    const unsubQuestion = questionEngineService.subscribe((qState) => {
      setIsQuestionActive(Boolean(qState.question || qState.followUp || qState.isThinking));
    });

    const handleOutsideClick = () => setContextMenuPos(null);
    const handleOpenDashboardEvent = () => setIsDashboardOpen(true);
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('vcamp:open-dashboard', handleOpenDashboardEvent);

    return () => {
      unsubAlert();
      unsubReminders();
      unsubQuestion();
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('vcamp:open-dashboard', handleOpenDashboardEvent);
    };
  }, []);

  const handleMinimizeToTray = async () => {
    setContextMenuPos(null);
    try {
      if (isTauri) {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        await getCurrentWebviewWindow().hide();
      }
    } catch {}
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
    setTimeout(() => {
      document.getElementById('vcamp-mic-button')?.click();
    }, 50);
  };

  const handleRobotClick = () => {
    if (isSpeaking) speechService.stop();
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

  const renderHeader = () => (
    <div
      data-tauri-drag-region
      className={`h-8 flex items-center justify-between px-1 cursor-move z-40 transition-opacity duration-200 select-none ${
        isHovered || activeAlert || isRemindersOpen || isChatOpen ? 'opacity-100' : 'opacity-85'
      }`}
      style={{ width: `${dimensions.robotWidth}px` }}
      title="Drag to move companion • Right-click for menu"
    >
      <div
        data-tauri-drag-region
        className="flex items-center gap-1 px-2 py-0.5 rounded-full vcamp-pill text-[10px] text-vcamp-primary pointer-events-none"
      >
        <Move className="w-2.5 h-2.5" />
        <span className="font-bold">VCamp</span>
      </div>

      <div className="flex items-center gap-0.5 vcamp-pill rounded-full px-1.5 py-0.5">
        <button
          type="button"
          onClick={handleToggleChat}
          className={`p-1 rounded transition-colors ${
            isChatOpen
              ? 'text-vcamp-primary bg-vcamp-secondary'
              : 'text-vcamp-muted hover:text-vcamp-primary'
          }`}
          title="Chat"
        >
          <MessageSquare className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-1 rounded transition-colors ${
            isRecording ? 'text-vcamp-error bg-red-50' : 'text-vcamp-muted hover:text-vcamp-primary'
          }`}
          title="Voice Input"
        >
          <Mic className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => {
            setIsMinimalSettingsOpen(false);
            setIsRemindersOpen((prev) => !prev);
          }}
          className={`p-1 rounded relative transition-colors ${
            isRemindersOpen
              ? 'text-vcamp-warning bg-amber-50'
              : 'text-vcamp-muted hover:text-vcamp-primary'
          }`}
          title="Reminders"
        >
          <Bell className="w-3 h-3" />
          {pendingReminders.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-vcamp-primary rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => openCharacterStudio()}
          data-testid="header-character-studio-btn"
          className="p-1 text-vcamp-muted hover:text-vcamp-primary transition-colors rounded"
          title="3D Character Studio"
        >
          <Users className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => setIsDashboardOpen(true)}
          data-testid="header-workspace-btn"
          className="p-1 text-vcamp-muted hover:text-vcamp-primary transition-colors rounded"
          title="Open Full Workspace"
        >
          <Maximize2 className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={handleMinimizeToTray}
          className="p-1 text-vcamp-muted hover:text-vcamp-text transition-colors rounded"
          title="Hide to System Tray"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  const renderRobotViewport = () => (
    <div
      style={{ width: `${dimensions.robotWidth}px`, height: `${dimensions.robotHeight}px` }}
      className="relative shrink-0 flex items-center justify-center cursor-pointer select-none p-1"
      onClick={handleRobotClick}
      onContextMenu={handleRobotContextMenu}
      title="Click to chat • Right-click for options"
    >
      {isRemindersOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-9 left-1.5 right-1.5 z-50 vcamp-card rounded-xl p-2.5 text-xs space-y-2"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-vcamp-border">
            <span className="font-semibold text-vcamp-text text-[11px] flex items-center gap-1">
              <Bell className="w-3 h-3 text-vcamp-primary" />
              Reminders ({pendingReminders.length})
            </span>
            <button
              type="button"
              onClick={() => setIsRemindersOpen(false)}
              className="text-vcamp-muted hover:text-vcamp-text"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1.5">
            {pendingReminders.length === 0 ? (
              <p className="text-[10px] text-vcamp-muted text-center py-2">No pending reminders.</p>
            ) : (
              pendingReminders.map((r) => (
                <div
                  key={r.id}
                  className="p-1.5 rounded-lg bg-slate-50 border border-vcamp-border flex items-center justify-between gap-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-vcamp-text text-[10px] truncate font-medium">{r.title}</p>
                    <span className="text-[9px] text-vcamp-primary">
                      {new Date(r.dueTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => reminderService.completeReminder(r.id)}
                      className="p-1 rounded bg-emerald-50 text-vcamp-success hover:bg-emerald-100"
                      title="Complete"
                    >
                      <Check className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => reminderService.snoozeReminder(r.id, 10)}
                      className="p-1 rounded bg-vcamp-secondary text-vcamp-primary hover:bg-blue-100"
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

      <CompanionScene />

      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none z-30 whitespace-nowrap">
        <div
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 vcamp-pill transition-opacity duration-200 ${
            isRecording
              ? 'text-vcamp-error border-red-200'
              : isSpeaking
              ? 'text-vcamp-primary border-blue-200'
              : isSleeping || state === 'sleep'
              ? 'text-vcamp-muted'
              : state === 'thinking' || currentAction === 'think'
              ? 'text-vcamp-primary'
              : isHovered
              ? 'text-vcamp-text opacity-100'
              : 'opacity-0'
          }`}
        >
          {isRecording
            ? 'Listening...'
            : isSpeaking
            ? 'Speaking...'
            : isSleeping || state === 'sleep'
            ? 'Resting'
            : state === 'thinking' || currentAction === 'think'
            ? 'Thinking...'
            : employee
            ? employee.full_name
            : 'VCamp Active'}
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full relative bg-transparent select-none">
        <AuthModal onSuccess={() => useAuthStore.getState().checkAuth()} />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative flex flex-col justify-end select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isMinimalSettingsOpen && (
        <MinimalSettingsModal onClose={() => setIsMinimalSettingsOpen(false)} />
      )}
      <DashboardModal />

      {isTauri ? (
        <div className="w-full h-full flex flex-col justify-end">
          {renderHeader()}
          <div className="flex items-end gap-3 w-full">
            {renderRobotViewport()}
            {activeAlert && !isChatOpen && (
              <ReminderBubble reminder={activeAlert} onClose={() => setActiveAlert(null)} />
            )}
            {!activeAlert && isQuestionActive && !isChatOpen && (
              <QuestionBubble onClose={() => setIsQuestionActive(false)} />
            )}
            {isChatOpen && (
              <ChatWindow
                style={{ width: `${dimensions.chatWidth}px`, height: `${dimensions.chatHeight}px` }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="fixed bottom-6 left-6 flex flex-col items-start gap-1 z-40">
          {renderHeader()}
          <div className="flex items-end gap-3">
            {renderRobotViewport()}
            {activeAlert && !isChatOpen && (
              <ReminderBubble reminder={activeAlert} onClose={() => setActiveAlert(null)} />
            )}
            {!activeAlert && isQuestionActive && !isChatOpen && (
              <QuestionBubble onClose={() => setIsQuestionActive(false)} />
            )}
            {isChatOpen && (
              <ChatWindow
                style={{ width: `${dimensions.chatWidth}px`, height: `${dimensions.chatHeight}px` }}
              />
            )}
          </div>
        </div>
      )}

      {contextMenuPos && (
        <div
          className="fixed z-50 vcamp-card rounded-xl p-1.5 w-52 text-xs text-vcamp-text"
          style={{
            left: `${Math.min(Math.max(contextMenuPos.x, 16), window.innerWidth - 224)}px`,
            top: `${Math.min(Math.max(contextMenuPos.y - 260, 10), window.innerHeight - 310)}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-vcamp-primary border-b border-vcamp-border uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>VDart Companion</span>
            {employee && <span className="text-vcamp-muted font-medium">{employee.role}</span>}
          </div>

          <button
            type="button"
            onClick={handleToggleChat}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-vcamp-secondary hover:text-vcamp-primary text-left"
          >
            <MessageSquare className="w-3.5 h-3.5 text-vcamp-primary" />
            <span>Open Conversation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDashboardOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-vcamp-secondary hover:text-vcamp-primary text-left"
          >
            <Maximize2 className="w-3.5 h-3.5 text-vcamp-primary" />
            <span>Full Workspace Mode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openCharacterStudio();
              setContextMenuPos(null);
            }}
            data-testid="context-character-studio-btn"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-vcamp-secondary hover:text-vcamp-primary text-left"
          >
            <Users className="w-3.5 h-3.5 text-vcamp-primary" />
            <span>3D Character Studio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setContextMenuPos(null);
              setIsRemindersOpen(false);
              if (isChatOpen) setIsChatOpen(false);
              questionEngineService.triggerQuestion(true);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-vcamp-secondary hover:text-vcamp-primary text-left"
          >
            <HelpCircle className="w-3.5 h-3.5 text-vcamp-primary" />
            <span>Quick Check-in</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSleeping(!isSleeping);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left"
          >
            <Moon className="w-3.5 h-3.5 text-vcamp-muted" />
            <span>{isSleeping ? 'Wake Companion' : 'Rest Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMinimalSettingsOpen(true);
              setContextMenuPos(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left"
          >
            <Sliders className="w-3.5 h-3.5 text-vcamp-muted" />
            <span>Quick Preferences</span>
          </button>

          <div className="my-1 border-t border-vcamp-border" />

          <button
            type="button"
            onClick={handleMinimizeToTray}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left"
          >
            <Minimize2 className="w-3.5 h-3.5 text-vcamp-muted" />
            <span>Minimize to Tray</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setContextMenuPos(null);
              await logout();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-vcamp-error text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={handleExitApp}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-vcamp-error text-left"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Exit VCamp</span>
          </button>
        </div>
      )}
    </div>
  );
};
