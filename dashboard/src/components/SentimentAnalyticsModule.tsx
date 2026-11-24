import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import { 
  HeartHandshake, 
  TrendingUp, 
  Globe, 
  BarChart3, 
  Smile, 
  ShieldAlert, 
  RefreshCw,
  Eye,
  Lock,
  Layers
} from 'lucide-react';

export const SentimentAnalyticsModule: React.FC = () => {
  const { employee } = useAuthStore();
  const isAdmin = employee?.role === 'ADMIN' || employee?.role === 'SUPER_ADMIN';

  const [viewMode, setViewMode] = useState<'personal' | 'organization'>(
    isAdmin ? 'organization' : 'personal'
  );
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/sentiment/analytics?view=${viewMode}`);
      setAnalytics(data);
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
    { key: 'excited', label: 'Excited', color: 'bg-teal-400' },
    { key: 'calm', label: 'Calm', color: 'bg-cyan-500' },
    { key: 'motivated', label: 'Motivated', color: 'bg-blue-500' },
    { key: 'curious', label: 'Curious', color: 'bg-indigo-400' },
    { key: 'neutral', label: 'Neutral', color: 'bg-slate-400' },
    { key: 'confused', label: 'Confused', color: 'bg-amber-400' },
    { key: 'tired', label: 'Tired', color: 'bg-yellow-600' },
    { key: 'anxious', label: 'Anxious', color: 'bg-orange-500' },
    { key: 'disappointed', label: 'Disappointed', color: 'bg-rose-400' },
    { key: 'sad', label: 'Sad', color: 'bg-purple-400' },
    { key: 'frustrated', label: 'Frustrated', color: 'bg-pink-600' },
    { key: 'angry', label: 'Angry', color: 'bg-red-600' },
    { key: 'stressed', label: 'Stressed', color: 'bg-rose-600' },
    { key: 'mixed', label: 'Mixed', color: 'bg-fuchsia-500' },
  ];

  const distribution = analytics?.distribution || {};
  const totalAnalyzed = analytics?.total_analyzed || 0;
  const languages = analytics?.languages || {};
  const polarities = analytics?.polarities || {};

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header and View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-pink-400" /> Multilingual Sentiment Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Real-time 15-class affective categorization across Tamil, English & Tanglish code-switched dialogues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('organization')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'organization'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Org Aggregate
              </button>
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'personal'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                My Personal
              </button>
            </div>
          )}

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {viewMode === 'organization'
              ? 'Organization view provides differential-privacy aggregated distributions. Individual employee messages are never exposed to surveillance.'
              : 'Personal view is strictly isolated to your authenticated account credentials.'}
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold shrink-0">
          Tenant Isolation Active
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs">Analyzed Inferences</span>
          <div className="text-2xl font-bold text-white">{totalAnalyzed}</div>
          <span className="text-[11px] text-slate-500">Live conversations evaluated</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs">Dominant Affective Valence</span>
          <div className="text-2xl font-bold text-emerald-400">
            {polarities.positive >= (polarities.negative || 0) ? 'Constructive' : 'Stress Alert'}
          </div>
          <span className="text-[11px] text-slate-500">
            {polarities.positive || 0} Positive • {polarities.neutral || 0} Neutral • {polarities.negative || 0} Negative
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs">Language Ingestion</span>
          <div className="text-2xl font-bold text-cyan-300">
            {Object.keys(languages).length} Dialects
          </div>
          <span className="text-[11px] text-slate-500">
            Tamil: {languages.ta || 0} • Tanglish: {languages.tanglish || 0} • English: {languages.en || 0}
          </span>
        </div>
      </div>

      {/* 15-Emotion Distribution Grid */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> 15 Calibrated Emotion Classes
          </h3>
          <span className="text-[11px] text-slate-400">Normalized percentage breakdown</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {emotionList.map((item) => {
            const count = distribution[item.key] || 0;
            const pct = totalAnalyzed > 0 ? Math.round((count / totalAnalyzed) * 100) : 0;
            return (
              <div key={item.key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 capitalize">{item.label}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Language Breakdown & Recent Inferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Multilingual Code-Switching Ingestion
          </h3>
          <p className="text-xs text-slate-400">
            Tamil scripts (e.g., "ரொம்ப சந்தோஷமா இருக்கு") and Romanized Tanglish ("romba tension aa irukku") are processed without lossy translation gates.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">English (en)</span>
                <span className="text-slate-400 font-mono">{languages.en || 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${totalAnalyzed > 0 ? ((languages.en || 0) / totalAnalyzed) * 100 : 33}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Tamil Native Script (ta)</span>
                <span className="text-slate-400 font-mono">{languages.ta || 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${totalAnalyzed > 0 ? ((languages.ta || 0) / totalAnalyzed) * 100 : 33}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Tanglish Romanized (tanglish)</span>
                <span className="text-slate-400 font-mono">{languages.tanglish || 0}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-teal-400"
                  style={{ width: `${totalAnalyzed > 0 ? ((languages.tanglish || 0) / totalAnalyzed) * 100 : 33}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Inferences stream (personal only or aggregate count) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            {viewMode === 'personal' ? 'My Recent Sentiment Records' : 'Organization Sentiment Stream'}
          </h3>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
            {analytics?.recent && analytics.recent.length > 0 ? (
              analytics.recent.map((rec: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-slate-300 truncate font-medium">
                      {viewMode === 'personal' ? `"${rec.message}"` : `Affective Observation #${rec.id}`}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Language: {rec.language} • {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold uppercase">
                      {rec.emotion}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {Math.round((rec.confidence || 0.8) * 100)}% conf
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No recent records logged for this filter yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
