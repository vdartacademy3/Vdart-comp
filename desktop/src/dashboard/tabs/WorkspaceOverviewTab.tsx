import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  HeartHandshake,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useCompanionStore } from '../../stores/companionStore';
import { useAuthStore } from '../../stores/authStore';
import { getCharacterById } from '../../characters/characterRegistry';
import { ChatWindow } from '../../chat/ChatWindow';
import { getSavedAIProvider } from '../../services/aiProviderService';
import { moodTimelineService } from '../../services/moodTimelineService';
import { reminderService } from '../../services/reminderService';

interface WorkspaceOverviewTabProps {
  onNavigate: (tab: string) => void;
}

export const WorkspaceOverviewTab: React.FC<WorkspaceOverviewTabProps> = ({ onNavigate }) => {
  const { selectedCharacterId, state, sentiment, sentimentConfidence, groqModel } =
    useCompanionStore();
  const { employee, authMode } = useAuthStore();
  const activeChar = getCharacterById(selectedCharacterId);
  const moodCount = moodTimelineService.getEntries().length;
  const pendingReminders = reminderService
    .getReminders()
    .filter((r) => r.status === 'pending' || r.status === 'snoozed').length;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-vcamp-primary" />
          VCamp Companion Workspace
        </h3>
        <p className="text-xs text-vcamp-muted">
          Central desktop overview for your 3D character, live conversation, sentiment context, and system status.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-vcamp-muted">
            Active Character
          </span>
          <p className="text-sm font-bold text-vcamp-text truncate">{activeChar.name}</p>
          <p className="text-xs text-vcamp-primary font-medium uppercase font-mono">
            State: {state}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('character_studio')}
            className="text-[11px] text-vcamp-primary hover:underline font-semibold flex items-center gap-1 pt-1"
          >
            <span>Open 3D Studio</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-vcamp-muted">
            Sentiment Context
          </span>
          <p className="text-sm font-bold text-vcamp-text capitalize">
            {sentiment}{' '}
            <span className="text-xs font-normal text-vcamp-muted">
              ({Math.round((sentimentConfidence || 0.85) * 100)}%)
            </span>
          </p>
          <p className="text-xs text-vcamp-muted">{moodCount} consented entries</p>
          <button
            type="button"
            onClick={() => onNavigate('sentiment')}
            className="text-[11px] text-vcamp-primary hover:underline font-semibold flex items-center gap-1 pt-1"
          >
            <span>View Wellbeing</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-vcamp-muted">
            AI Provider
          </span>
          <p className="text-sm font-bold text-vcamp-text uppercase">{getSavedAIProvider()}</p>
          <p className="text-xs text-vcamp-muted truncate font-mono">{groqModel}</p>
          <button
            type="button"
            onClick={() => onNavigate('conversations')}
            className="text-[11px] text-vcamp-primary hover:underline font-semibold flex items-center gap-1 pt-1"
          >
            <span>Configure AI &amp; Voice</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-vcamp-muted">
            System Status
          </span>
          <p className="text-sm font-bold text-vcamp-success flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Operational
          </p>
          <p className="text-xs text-vcamp-muted">
            {authMode === 'enterprise' ? 'Enterprise Connected' : 'Local Standalone'} •{' '}
            {pendingReminders} reminders
          </p>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="text-[11px] text-vcamp-primary hover:underline font-semibold flex items-center gap-1 pt-1"
          >
            <span>System &amp; Privacy</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Split: Character Card + Live Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-vcamp-border shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-vcamp-text flex items-center gap-1.5">
                <Users className="w-4 h-4 text-vcamp-primary" />
                Character Workspace
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-vcamp-secondary text-vcamp-primary font-semibold">
                {activeChar.kind === 'glb' ? 'Rigged GLB' : 'Procedural 3D'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-vcamp-border flex items-center gap-3.5">
              {activeChar.previewImage ? (
                <img
                  src={activeChar.previewImage}
                  alt={activeChar.name}
                  className="w-20 h-20 rounded-xl object-cover border border-vcamp-border bg-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-vcamp-secondary border border-blue-200 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-vcamp-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-bold text-vcamp-text">{activeChar.name}</p>
                <p className="text-xs text-vcamp-primary font-medium">{activeChar.subtitle}</p>
                <p className="text-[11px] text-vcamp-muted line-clamp-2">{activeChar.description}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-vcamp-secondary border border-blue-200 text-xs text-vcamp-text space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-vcamp-primary" />
                Privacy &amp; Consent Guarantee
              </div>
              <p className="text-[11px] text-vcamp-muted leading-relaxed">
                Signed in as <strong>{employee?.full_name || 'User'}</strong>. Sentiment analysis is consent-based, non-diagnostic, and private to your account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('character_studio')}
            className="w-full py-2.5 px-4 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white text-xs font-semibold transition-colors"
          >
            Customize Character &amp; Test 13 Animations
          </button>
        </div>

        <div className="lg:col-span-7">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-vcamp-text uppercase tracking-wider">
            <MessageSquare className="w-4 h-4 text-vcamp-primary" />
            Live Companion Conversation
          </div>
          <ChatWindow embedded className="w-full h-[360px]" />
        </div>
      </div>
    </div>
  );
};
