import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  BrainCircuit, 
  HelpCircle, 
  Bell, 
  Cpu, 
  Moon, 
  Sun, 
  Sparkles, 
  Footprints, 
  Zap, 
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { useCompanionStore } from '../../stores/companionStore';
import { userProfileService } from '../../services/userProfileService';
import { questionEngineService } from '../../services/questionEngineService';
import { reminderService } from '../../services/reminderService';
import { desktopMovementService } from '../../services/desktopMovementService';
import { sentimentEngine, SENTIMENT_MODEL_VERSION } from '../../services/sentimentService';

interface OverviewTabProps {
  onNavigateTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab }) => {
  const { 
    state, 
    robotSize, 
    sentiment, 
    sentimentConfidence, 
    groqModel, 
    isSleeping, 
    setIsSleeping,
    triggerAction 
  } = useCompanionStore();

  const activeProfile = userProfileService.getActiveProfile();
  const answeredCheckinsCount = activeProfile.questionHistory.length;
  const questionConfig = questionEngineService.getConfig();
  const pendingRemindersCount = reminderService.getReminders().filter((r) => r.status === 'pending').length;
  const movementMode = desktopMovementService.getMode();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-cyan-400" />
          VCamp Control Center & System Telemetry
        </h3>
        <p className="text-xs text-slate-400">
          High-level operational overview, live sentiment telemetry, companion scale status, and quick command controls.
        </p>
      </div>

      {/* Primary Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Active Profile */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Profile</span>
          <p className="text-base font-bold text-white truncate">{activeProfile.name}</p>
          <span className="text-xs text-cyan-400 font-medium block">
            Role: {activeProfile.role || 'Employee'}
          </span>
          <button
            onClick={() => onNavigateTab('profile')}
            className="text-[11px] text-slate-400 hover:text-cyan-300 hover:underline pt-1 block"
          >
            Manage Profiles & Memory →
          </button>
        </div>

        {/* Robot Size & Scale */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Robot Size Mode</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase">
              {robotSize}
            </span>
          </div>
          <p className="text-base font-bold text-white capitalize">
            {robotSize === 'medium' ? 'Medium (Reduced ~35%)' : robotSize === 'small' ? 'Small (~155px)' : 'Large (~245px)'}
          </p>
          <span className="text-xs text-emerald-400 font-medium block">
            State: <span className="uppercase font-mono">{state}</span>
          </span>
          <button
            onClick={() => onNavigateTab('appearance')}
            className="text-[11px] text-slate-400 hover:text-cyan-300 hover:underline pt-1 block"
          >
            Change Robot Scale & Gestures →
          </button>
        </div>

        {/* Sentiment Pipeline */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sentiment Intelligence</span>
          <p className="text-base font-bold text-cyan-300 capitalize flex items-center gap-1.5">
            {sentiment || 'Neutral'}
            {sentimentConfidence ? (
              <span className="text-xs font-mono text-slate-400 font-normal">
                ({(sentimentConfidence * 100).toFixed(0)}%)
              </span>
            ) : null}
          </p>
          <span className="text-xs text-slate-400 font-mono block">
            Model: {SENTIMENT_MODEL_VERSION}
          </span>
          <button
            onClick={() => onNavigateTab('live_sentiment')}
            className="text-[11px] text-slate-400 hover:text-cyan-300 hover:underline pt-1 block"
          >
            Inspect Live Reasoning & Feedback →
          </button>
        </div>

        {/* 2-Minute Question Check-in */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Question Check-ins</span>
          <p className="text-base font-bold text-white">{answeredCheckinsCount} Answered</p>
          <span className="text-xs text-emerald-400 font-medium block">
            {questionConfig.isPaused ? 'Engine: Paused' : `Interval: ${questionConfig.intervalSeconds}s (Testing)`}
          </span>
          <button
            onClick={() => onNavigateTab('question_engine')}
            className="text-[11px] text-slate-400 hover:text-cyan-300 hover:underline pt-1 block"
          >
            Configure 2m Testing Scheduler →
          </button>
        </div>

        {/* Active Reminders */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Smart Reminders</span>
          <p className="text-base font-bold text-white">{pendingRemindersCount} Scheduled</p>
          <span className="text-xs text-cyan-400 font-medium block">
            Spoken Announcements: Active
          </span>
          <button
            onClick={() => onNavigateTab('reminders')}
            className="text-[11px] text-slate-400 hover:text-cyan-300 hover:underline pt-1 block"
          >
            View Reminders & Alarms →
          </button>
        </div>

        {/* AI Backbone */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">AI Inference LPU</span>
          <p className="text-base font-bold text-white truncate">Groq Cloud</p>
          <span className="text-xs text-cyan-400 font-mono truncate block">{groqModel}</span>
          <button
            onClick={() => onNavigateTab('ai_models')}
            className="text-[11px] text-slate-400 hover:text-cyan-300 hover:underline pt-1 block"
          >
            Configure Models & API Key →
          </button>
        </div>
      </div>

      {/* Quick Desktop Controls Toolbar */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Quick Desktop Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => questionEngineService.triggerQuestion(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Trigger Question Now
          </button>

          <button
            onClick={() => {
              reminderService.addReminder({
                title: 'Testing Check-in Reminder',
                description: 'Verifying physical robot appearance and spoken voice',
                dueTime: new Date(Date.now() + 5000),
                priority: 'high',
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Test Reminder in 5s
          </button>

          <button
            onClick={() => desktopMovementService.startWalk()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Footprints className="w-3.5 h-3.5 text-cyan-400" />
            Walk Screen
          </button>

          <button
            onClick={() => desktopMovementService.returnToHome()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            Return Home
          </button>

          <button
            onClick={() => setIsSleeping(!isSleeping)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {isSleeping ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            {isSleeping ? 'Wake Up' : 'Sleep Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};
