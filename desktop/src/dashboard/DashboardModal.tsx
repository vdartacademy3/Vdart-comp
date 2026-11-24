import React, { useState } from 'react';
import { 
  X, 
  LayoutDashboard, 
  BrainCircuit, 
  HeartHandshake, 
  MessageSquare, 
  User, 
  HelpCircle, 
  Bell, 
  Volume2, 
  Bot, 
  Cpu, 
  FileCheck, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';
import { useCompanionStore } from '../stores/companionStore';
import { userProfileService } from '../services/userProfileService';

// 13 Modular Tabs
import { OverviewTab } from './tabs/OverviewTab';
import { LiveSentimentTab } from './tabs/LiveSentimentTab';
import { SentimentAnalyticsTab } from './tabs/SentimentAnalyticsTab';
import { ConversationsTab } from './tabs/ConversationsTab';
import { UserProfileTab } from './tabs/UserProfileTab';
import { QuestionEngineTab } from './tabs/QuestionEngineTab';
import { RemindersTab } from './tabs/RemindersTab';
import { VoiceSpeechTab } from './tabs/VoiceSpeechTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { AiModelTab } from './tabs/AiModelTab';
import { EvaluationTab } from './tabs/EvaluationTab';
import { PrivacyTab } from './tabs/PrivacyTab';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';

export type DashboardTab = 
  | 'overview' 
  | 'live_sentiment'
  | 'analytics'
  | 'conversations'
  | 'profile' 
  | 'question_engine' 
  | 'reminders' 
  | 'voice'
  | 'appearance' 
  | 'ai_models'
  | 'evaluation'
  | 'privacy'
  | 'diagnostics';

const NAVIGATION_ITEMS = [
  { id: 'overview' as DashboardTab, label: 'Overview & Status', icon: LayoutDashboard },
  { id: 'live_sentiment' as DashboardTab, label: 'Live Sentiment Reasoning', icon: BrainCircuit, badge: 'Core' },
  { id: 'analytics' as DashboardTab, label: 'Sentiment Analytics', icon: HeartHandshake },
  { id: 'conversations' as DashboardTab, label: 'Conversations & Chat', icon: MessageSquare },
  { id: 'profile' as DashboardTab, label: 'User Profiles & Memory', icon: User },
  { id: 'question_engine' as DashboardTab, label: 'Question Engine (2m)', icon: HelpCircle },
  { id: 'reminders' as DashboardTab, label: 'Smart Reminders', icon: Bell },
  { id: 'voice' as DashboardTab, label: 'Indian Voice & Speech', icon: Volume2 },
  { id: 'appearance' as DashboardTab, label: 'Robot Appearance & Scale', icon: Bot },
  { id: 'ai_models' as DashboardTab, label: 'AI Model & Groq LPU', icon: Cpu },
  { id: 'evaluation' as DashboardTab, label: 'Benchmark Evaluation', icon: FileCheck, badge: 'Real' },
  { id: 'privacy' as DashboardTab, label: 'Privacy & Data Isolation', icon: ShieldCheck },
  { id: 'diagnostics' as DashboardTab, label: 'System Diagnostics', icon: Activity },
];

export const DashboardModal: React.FC = () => {
  const { isDashboardOpen, setIsDashboardOpen } = useCompanionStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  if (!isDashboardOpen) return null;

  const activeProfile = userProfileService.getActiveProfile();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Top App Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-cyan-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-600/30">
              V
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-wide truncate flex items-center gap-2">
                VCamp Intelligent Workforce & Sentiment Platform
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 uppercase font-semibold">
                  {activeProfile.name}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Real-Time Multilingual Sentiment Intelligence • Desktop 3D Humanoid Companion • Privacy Isolated
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDashboardOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-2"
            title="Close Dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* Sidebar Navigation (13 Tabs) */}
          <div className="w-64 bg-slate-950/90 border-r border-cyan-500/20 p-2.5 space-y-1 select-none shrink-0 overflow-y-auto">
            {NAVIGATION_ITEMS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30 shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Pane */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900/60">
            {activeTab === 'overview' && <OverviewTab onNavigateTab={(t) => setActiveTab(t)} />}
            {activeTab === 'live_sentiment' && <LiveSentimentTab />}
            {activeTab === 'analytics' && <SentimentAnalyticsTab />}
            {activeTab === 'conversations' && <ConversationsTab />}
            {activeTab === 'profile' && <UserProfileTab />}
            {activeTab === 'question_engine' && <QuestionEngineTab />}
            {activeTab === 'reminders' && <RemindersTab />}
            {activeTab === 'voice' && <VoiceSpeechTab />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'ai_models' && <AiModelTab />}
            {activeTab === 'evaluation' && <EvaluationTab />}
            {activeTab === 'privacy' && <PrivacyTab />}
            {activeTab === 'diagnostics' && <DiagnosticsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};
