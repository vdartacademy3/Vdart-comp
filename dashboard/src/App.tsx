import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { LoginModal } from './components/LoginModal';
import { OverviewModule } from './components/OverviewModule';
import { EmployeeManagementModule } from './components/EmployeeManagementModule';
import { SentimentAnalyticsModule } from './components/SentimentAnalyticsModule';
import { ModelEvaluationModule } from './components/ModelEvaluationModule';
import { SystemConfigModule } from './components/SystemConfigModule';
import { CompanionManagementModule } from './components/CompanionManagementModule';
import { QuestionEngineModule } from './components/QuestionEngineModule';
import { RemindersManagementModule } from './components/RemindersManagementModule';
import { VoiceConfigModule } from './components/VoiceConfigModule';
import { PrivacyAuditModule } from './components/PrivacyAuditModule';
import { 
  LayoutDashboard, 
  Users, 
  HeartHandshake, 
  Cpu, 
  Settings, 
  Bot, 
  HelpCircle, 
  Bell, 
  Volume2, 
  ShieldCheck, 
  LogOut, 
  User, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, employee, logout, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    checkAuth().then((authed) => {
      if (!authed) {
        setShowLoginModal(true);
      }
    });

    const handleUnauthorized = () => {
      setShowLoginModal(true);
    };
    window.addEventListener('vcamp:dashboard-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('vcamp:dashboard-unauthorized', handleUnauthorized);
  }, []);

  const isAdmin = employee?.role === 'ADMIN' || employee?.role === 'SUPER_ADMIN';

  const navItems = [
    { id: 'overview', label: 'Overview & Health', icon: LayoutDashboard },
    ...(isAdmin ? [{ id: 'employees', label: 'Employee Management', icon: Users }] : []),
    { id: 'sentiment', label: 'Sentiment Analytics', icon: HeartHandshake },
    { id: 'evaluation', label: 'Model Evaluation & Evals', icon: Cpu },
    { id: 'companion', label: 'Companion Management', icon: Bot },
    { id: 'questions', label: 'Question Engine', icon: HelpCircle },
    { id: 'reminders', label: 'Reminders & Alerts', icon: Bell },
    { id: 'voice', label: 'Voice Configuration', icon: Volume2 },
    ...(isAdmin ? [{ id: 'system', label: 'System Configuration', icon: Settings }] : []),
    { id: 'privacy', label: 'Privacy & Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-white text-vcamp-text flex flex-col font-sans">
      {/* Login Gate Modal */}
      <LoginModal
        isOpen={showLoginModal || !isAuthenticated}
        onSuccess={() => setShowLoginModal(false)}
      />

      {/* Top Enterprise Header */}
      <header className="border-b border-vcamp-border bg-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vcamp-primary flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            V
          </div>
          <div>
            <h1 className="text-base font-bold text-vcamp-text flex items-center gap-2">
              VDart Companion (VCamp) Enterprise Console
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-vcamp-secondary text-vcamp-primary border border-blue-200 font-semibold uppercase tracking-wider">
                v3.0
              </span>
            </h1>
            <p className="text-[11px] text-vcamp-muted">
              Privacy-Preserving Workplace Console • Multilingual Tamil, Tanglish &amp; English
            </p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && employee ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-vcamp-border rounded-xl px-3 py-1.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-vcamp-secondary border border-blue-200 flex items-center justify-center text-vcamp-primary font-bold">
                {employee.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-vcamp-text leading-tight">{employee.full_name}</div>
                <div className="text-[10px] text-vcamp-primary font-mono leading-tight">{employee.role}</div>
              </div>
              <button
                onClick={() => logout()}
                className="ml-2 p-1.5 text-vcamp-muted hover:text-vcamp-error transition-colors rounded-lg hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white font-semibold text-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <nav className="col-span-12 lg:col-span-3 space-y-1">
          <div className="text-[11px] font-bold text-vcamp-muted uppercase tracking-wider px-3 mb-2">
            Navigation Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-vcamp-secondary text-vcamp-primary border border-blue-200'
                    : 'text-vcamp-muted hover:text-vcamp-text hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-vcamp-border px-2 space-y-2">
            <div className="p-3 rounded-xl bg-vcamp-secondary border border-blue-200 text-[11px] text-vcamp-text space-y-1">
              <div className="flex items-center gap-1.5 text-vcamp-primary font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Desktop Companion
              </div>
              <p className="text-[10px] text-vcamp-muted">
                The Windows desktop companion runs in compact floating mode and full workspace mode.
              </p>
            </div>
          </div>
        </nav>

        {/* Dynamic Module Content Viewport */}
        <main className="col-span-12 lg:col-span-9 bg-slate-50 border border-vcamp-border rounded-2xl p-6 min-w-0">
          {activeTab === 'overview' && <OverviewModule />}
          {activeTab === 'employees' && <EmployeeManagementModule />}
          {activeTab === 'sentiment' && <SentimentAnalyticsModule />}
          {activeTab === 'evaluation' && <ModelEvaluationModule />}
          {activeTab === 'system' && <SystemConfigModule />}
          {activeTab === 'companion' && <CompanionManagementModule />}
          {activeTab === 'questions' && <QuestionEngineModule />}
          {activeTab === 'reminders' && <RemindersManagementModule />}
          {activeTab === 'voice' && <VoiceConfigModule />}
          {activeTab === 'privacy' && <PrivacyAuditModule />}
        </main>
      </div>
    </div>
  );
};
export default App;
