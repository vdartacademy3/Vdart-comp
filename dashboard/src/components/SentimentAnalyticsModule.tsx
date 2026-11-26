import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import {
  HeartHandshake,
  Globe,
  BarChart3,
  RefreshCw,
  Lock,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const SentimentAnalyticsModule: React.FC = () => {
  const { employee } = useAuthStore();
  const isAdmin = employee?.role === 'ADMIN' || employee?.role === 'SUPER_ADMIN';

  const [viewMode, setViewMode] = useState<'personal' | 'organization'>(
    isAdmin ? 'organization' : 'personal'
  );
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/sentiment/analytics?scope=${viewMode}`);
      setAnalytics(data);
      if (viewMode === 'personal') {
        try {
          const hist = await apiClient.get('/sentiment/history?limit=15');
          setRecentHistory(Array.isArray(hist) ? hist : []);
        } catch {}
      }
    } catch (e) {
      console.error('Failed to load sentiment analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [viewMode]);

  const emotionList = [
    { key: 'happy', label: 'Happy', color: 'bg-emerald-500' },
    { key: 'excited', label: 'Excited', color: 'bg-teal-500' },
    { key: 'calm', label: 'Calm', color: 'bg-[#1769D2]' },
    { key: 'motivated', label: 'Motivated', color: 'bg-blue-500' },
    { key: 'curious', label: 'Curious', color: 'bg-indigo-500' },
    { key: 'neutral', label: 'Neutral', color: 'bg-slate-400' },
    { key: 'confused', label: 'Confused', color: 'bg-amber-500' },
    { key: 'tired', label: 'Tired', color: 'bg-yellow-600' },
    { key: 'anxious', label: 'Anxious', color: 'bg-orange-500' },
    { key: 'disappointed', label: 'Disappointed', color: 'bg-rose-400' },
    { key: 'sad', label: 'Sad', color: 'bg-purple-500' },
    { key: 'frustrated', label: 'Frustrated', color: 'bg-pink-600' },
    { key: 'angry', label: 'Angry', color: 'bg-red-600' },
    { key: 'stressed', label: 'Stressed', color: 'bg-rose-600' },
    { key: 'mixed', label: 'Mixed', color: 'bg-slate-500' },
  ];

  const distribution = analytics?.emotion_distribution || {};
  const totalAnalyzed = analytics?.total_analyzed || 0;
  const languages = analytics?.language_distribution || {};
  const contextDist = analytics?.context_distribution || {};
  const departmentAggregates: any[] = analytics?.department_aggregates || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#1769D2]" /> Sentiment & Wellbeing Analytics
          </h2>
          <p className="text-xs text-[#64748B]">
            Privacy-preserving affective insights across English, Tamil & Tanglish interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs">
              <button
                onClick={() => setViewMode('organization')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  viewMode === 'organization'
                    ? 'bg-[#1769D2] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                Org Aggregate
              </button>
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  viewMode === 'personal'
                    ? 'bg-[#1769D2] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                My Personal
              </button>
            </div>
          )}

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#64748B]"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-[#EAF3FF] border border-[#1769D2]/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#172B4D]">
          <Lock className="w-4 h-4 text-[#1769D2] shrink-0" />
          <span>
            {viewMode === 'organization'
              ? 'Organization view enforces k-anonymity thresholding and non-diagnostic framing. Private messages are never exposed.'
              : 'Personal wellbeing view is isolated to your own consent-enabled session history.'}
          </span>
        </div>
        <span className="text-[10px] text-[#1769D2] uppercase tracking-wider font-bold shrink-0">
          Privacy Guard Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[#64748B] text-xs">Analyzed Signals</span>
          <div className="text-2xl font-bold text-[#172B4D]">{totalAnalyzed}</div>
          <span className="text-[11px] text-[#64748B]">Consented interactions evaluated</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[#64748B] text-xs">Dominant Signal</span>
          <div className="text-2xl font-bold text-[#1769D2] capitalize">
            {analytics?.dominant_emotion || 'Neutral'}
          </div>
          <span className="text-[11px] text-[#64748B]">
            Confidence avg: {Math.round((analytics?.average_confidence || 0) * 100)}% • Workload signals: {contextDist.workload || 0}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[#64748B] text-xs">Detected Dialects</span>
          <div className="text-2xl font-bold text-[#1769D2]">
            {Object.keys(languages).length} Scripts
          </div>
          <span className="text-[11px] text-[#64748B]">
            Tamil: {languages.ta || 0} • Tanglish: {languages.tanglish || 0} • English: {languages.en || 0}
          </span>
        </div>
      </div>

      {viewMode === 'organization' && departmentAggregates.length > 0 && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1769D2]" /> Department Wellbeing Aggregates (k-Anonymity Enforced)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {departmentAggregates.map((dept) => (
              <div key={dept.department} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#172B4D]">
                  <span>{dept.department}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[#64748B]">
                    n={dept.employee_count}
                  </span>
                </div>
                {dept.suppressed_for_privacy ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Suppressed for employee anonymity (below group minimum threshold).
                  </p>
                ) : (
                  <p className="text-[11px] text-[#64748B]">
                    Signals: {dept.record_count} • Dominant: {dept.dominant_emotion || 'neutral'} • Positive: {Math.round((dept.positive_rate || 0) * 100)}% • Workload concern: {Math.round((dept.workload_concern_rate || 0) * 100)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1769D2]" /> Affective Distribution
          </h3>
          <span className="text-[11px] text-[#64748B]">Normalized percentages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {emotionList.map((item) => {
            const count = distribution[item.key] || 0;
            const pct = totalAnalyzed > 0 ? Math.round((count / totalAnalyzed) * 100) : 0;
            return (
              <div key={item.key} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#172B4D] capitalize">{item.label}</span>
                  <span className="text-[#64748B] font-mono text-[11px]">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-300`}
                    style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#1769D2]" /> Multilingual Code-Switching
          </h3>
          <p className="text-xs text-[#64748B]">
            Tamil native script and Romanized Tanglish inputs are analyzed directly without lossy translation.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { label: 'English (en)', val: languages.en || 0, color: 'bg-[#1769D2]' },
              { label: 'Tamil Native Script (ta)', val: languages.ta || 0, color: 'bg-emerald-500' },
              { label: 'Tanglish Romanized (tanglish)', val: languages.tanglish || 0, color: 'bg-sky-500' },
            ].map((lang) => (
              <div key={lang.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#172B4D] font-medium">{lang.label}</span>
                  <span className="text-[#64748B] font-mono">{lang.val}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${lang.color}`}
                    style={{ width: `${totalAnalyzed > 0 ? (lang.val / totalAnalyzed) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1769D2]" />
            {viewMode === 'personal' ? 'My Recent Records' : 'Anonymized Signal Log'}
          </h3>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
            {viewMode === 'personal' && recentHistory.length > 0 ? (
              recentHistory.map((rec: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[#172B4D] truncate font-medium">
                      "{rec.message_text}"
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      {rec.detected_language} • {rec.context_category || 'general'} • {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EAF3FF] text-[#1769D2] border border-[#1769D2]/20 font-semibold uppercase">
                      {rec.primary_emotion}
                    </span>
                    <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                      {Math.round((rec.confidence || 0.8) * 100)}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[#64748B] text-xs">
                {viewMode === 'organization'
                  ? (analytics?.privacy_note || 'Individual transcripts are omitted in organization aggregate view.')
                  : 'No consented sentiment records logged yet.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
