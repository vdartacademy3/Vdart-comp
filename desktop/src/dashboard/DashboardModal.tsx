import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  HeartHandshake,
  HelpCircle,
  Bell,
  BarChart3,
  Settings,
  X,
  Minimize2,
} from 'lucide-react';
import { useCompanionStore } from '../stores/companionStore';
import { useAuthStore } from '../stores/authStore';
import { WorkspaceOverviewTab } from './tabs/WorkspaceOverviewTab';
import { CharacterStudioTab } from './tabs/CharacterStudioTab';
import { ConversationVoiceTab } from './tabs/ConversationVoiceTab';
import { SentimentWellbeingTab } from './tabs/SentimentWellbeingTab';
import { QuestionEngineTab } from './tabs/QuestionEngineTab';
import { RemindersTab } from './tabs/RemindersTab';
import { HrAnalyticsTab } from './tabs/HrAnalyticsTab';
import { SettingsSystemTab } from './tabs/SettingsSystemTab';

export type WorkspaceTab =
  | 'overview'
  | 'character_studio'
  | 'conversations'
  | 'sentiment'
  | 'question_engine'
  | 'reminders'
  | 'hr_analytics'
  | 'settings';

export const DashboardModal: React.FC = () => {
  const { isDashboardOpen, setIsDashboardOpen, activeDashboardTab, setActiveDashboardTab } =
    useCompanionStore();
  const { employee, authMode } = useAuthStore();

  if (!isDashboardOpen) return null;

  const isAdmin = employee?.role === 'ADMIN' || employee?.role === 'SUPER_ADMIN';
  const activeTab = (activeDashboardTab || 'overview') as WorkspaceTab;

  const navItems: Array<{ id: WorkspaceTab; label: string; icon: any; badge?: string }> = [
    { id: 'overview', label: 'Workspace Overview', icon: LayoutDashboard },
    { id: 'character_studio', label: '3D Character Studio', icon: Users, badge: '3D' },
    { id: 'conversations', label: 'Conversation & Voice', icon: MessageSquare },
    { id: 'sentiment', label: 'Sentiment & Wellbeing', icon: HeartHandshake },
    { id: 'question_engine', label: 'Question Engine', icon: HelpCircle },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    ...(isAdmin || authMode === 'enterprise'
      ? [{ id: 'hr_analytics' as WorkspaceTab, label: 'HR Analytics', icon: BarChart3 }]
      : []),
    { id: 'settings', label: 'Settings & System', icon: Settings },
  ];

  const isTauri =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 ${
        isTauri ? 'bg-transparent' : 'bg-slate-900/30 backdrop-blur-sm p-2 sm:p-4'
      }`}
    >
      <div className="relative w-full max-w-6xl h-[calc(100vh-12px)] bg-white border border-vcamp-border rounded-2xl shadow-corporate flex flex-col overflow-hidden text-vcamp-text font-sans">
        {/* Top Corporate Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-vcamp-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-vcamp-primary flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              V
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-vcamp-text truncate">
                  VDart Companion (VCamp)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-vcamp-secondary text-vcamp-primary font-semibold uppercase">
                  {authMode === 'enterprise' ? 'Enterprise' : 'Desktop'}
                </span>
              </div>
              <p className="text-[11px] text-vcamp-muted truncate">
                {employee ? `${employee.full_name} • ${employee.department}` : 'Desktop AI Workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDashboardOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-vcamp-border bg-white hover:bg-slate-50 text-xs font-medium text-vcamp-text"
              title="Switch back to Compact Floating Companion Mode"
            >
              <Minimize2 className="w-3.5 h-3.5 text-vcamp-primary" />
              <span className="hidden sm:inline">Compact Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDashboardOpen(false)}
              className="p-1.5 rounded-lg text-vcamp-muted hover:text-vcamp-text hover:bg-slate-100"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <nav className="w-60 bg-slate-50/70 border-r border-vcamp-border p-3 space-y-1 select-none shrink-0 overflow-y-auto">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`dashboard-tab-${tab.id}`}
                  onClick={() => setActiveDashboardTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-vcamp-secondary text-vcamp-primary border border-blue-200'
                      : 'text-vcamp-muted hover:text-vcamp-text hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-vcamp-primary' : 'text-vcamp-muted'
                      }`}
                    />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-vcamp-primary border border-blue-200 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <main className="flex-1 p-5 sm:p-6 overflow-y-auto bg-slate-50/40">
            {activeTab === 'overview' && (
              <WorkspaceOverviewTab onNavigate={(t) => setActiveDashboardTab(t)} />
            )}
            {activeTab === 'character_studio' && <CharacterStudioTab />}
            {activeTab === 'conversations' && <ConversationVoiceTab />}
            {activeTab === 'sentiment' && <SentimentWellbeingTab />}
            {activeTab === 'question_engine' && <QuestionEngineTab />}
            {activeTab === 'reminders' && <RemindersTab />}
            {activeTab === 'hr_analytics' && <HrAnalyticsTab />}
            {activeTab === 'settings' && <SettingsSystemTab />}
          </main>
        </div>
      </div>
    </div>
  );
};
