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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Login Gate Modal */}
      <LoginModal
        isOpen={showLoginModal || !isAuthenticated}
        onSuccess={() => setShowLoginModal(false)}
      />

      {/* Top Enterprise Header */}
      <header className="border-b border-cyan-500/20 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-900 via-cyan-600 to-blue-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-cyan-950/60 border border-cyan-400/40">
            V
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              VCamp Enterprise Intelligence Platform
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold uppercase tracking-wider">
                Production 2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Web Management Console • Multilingual Tamil + English Sentiment AI
            </p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && employee ? (
            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
                {employee.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-white leading-tight">{employee.full_name}</div>
                <div className="text-[10px] text-cyan-400 font-mono leading-tight">{employee.role}</div>
              </div>
              <button
                onClick={() => logout()}
                className="ml-2 p-1.5 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-700/60"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md"
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
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
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
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800/80 px-2 space-y-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Desktop Companion
              </div>
              <p className="text-[10px] text-slate-500">
                The desktop companion runs as a lightweight floating 3D avatar on your Windows desktop.
              </p>
            </div>
          </div>
        </nav>

        {/* Dynamic Module Content Viewport */}
        <main className="col-span-12 lg:col-span-9 bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-6 shadow-xl min-w-0">
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
