import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  TrendingUp, 
  Calendar, 
  BarChart2, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { moodTimelineService, DailyMoodSummary, MoodEntry } from '../../services/moodTimelineService';
import { feedbackStore, SentimentCategory } from '../../services/sentimentService';
import { useCompanionStore, SentimentType } from '../../stores/companionStore';

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10b981',
  excited: '#06b6d4',
  motivated: '#14b8a6',
  calm: '#38bdf8',
  curious: '#6366f1',
  neutral: '#94a3b8',
  sad: '#3b82f6',
  frustrated: '#f97316',
  angry: '#ef4444',
  anxious: '#f59e0b',
  stressed: '#ec4899',
  tired: '#64748b',
  confused: '#a855f7',
  disappointed: '#475569',
  mixed: '#8b5cf6',
  ambiguous: '#64748b',
  insufficient_evidence: '#334155',
};

export const SentimentAnalyticsTab: React.FC = () => {
  const [dailySummaries, setDailySummaries] = useState<DailyMoodSummary[]>([]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    setDailySummaries(moodTimelineService.getDailySummaries(7));
    setEntries(moodTimelineService.getEntries());

    const unsub = moodTimelineService.subscribe((list) => {
      setEntries(list);
      setDailySummaries(moodTimelineService.getDailySummaries(7));
    });
    return unsub;
  }, []);

  // Compute emotion counts across entries
  const totalEntries = entries.length;
  const emotionCounts: Record<string, number> = {};
  entries.forEach((e) => {
    emotionCounts[e.detectedSentiment] = (emotionCounts[e.detectedSentiment] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-cyan-400" />
          Sentiment Analytics, Mood Trends & Emotional Transitions
        </h3>
        <p className="text-xs text-slate-400">
          Temporal sentiment distributions, emotional valence curves, and conversational momentum analysis.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Total Signals Logged</span>
          <span className="text-2xl font-bold text-white">{totalEntries}</span>
          <span className="text-[11px] text-cyan-400 block mt-1">Multi-signal interactions</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Dominant State (7 Days)</span>
          <span className="text-2xl font-bold text-emerald-400 capitalize">
            {dailySummaries[0]?.dominantSentiment || 'Neutral'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Modal daily average</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">7-Day Mean Valence</span>
          <span className="text-2xl font-bold text-cyan-300">
            {dailySummaries.length > 0
              ? (dailySummaries.reduce((acc, d) => acc + d.averageValence, 0) / dailySummaries.length).toFixed(2)
              : '0.00'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Range: -1.00 to +1.00</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Feedback Agreement</span>
          <span className="text-2xl font-bold text-teal-300">
            {(feedbackStore.getCorrectionStats('active_user').userAgreementRate * 100).toFixed(0)}%
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Human confirmation rate</span>
        </div>
      </div>

      {/* 17 Emotion Distribution */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Emotional Category Frequency & Distribution</span>
          <span className="text-[11px] text-slate-400">Total samples: {totalEntries}</span>
        </h4>

        {totalEntries > 0 ? (
          <div className="space-y-2 pt-1">
            {Object.entries(emotionCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([emotion, count]) => {
                const pct = ((count / totalEntries) * 100).toFixed(1);
                const color = EMOTION_COLORS[emotion] || '#38bdf8';
                return (
                  <div key={emotion} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize font-medium text-slate-200">{emotion}</span>
                      <span className="text-slate-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No sentiment history logged yet. Chat with VCamp to see live distribution.</p>
        )}
      </div>

      {/* Daily Valence Trend (Past 7 Days) */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          7-Day Emotional Valence Timeline
        </h4>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {dailySummaries.slice(0, 7).reverse().map((day) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString([], { weekday: 'short' });
            const val = day.averageValence;
            const barHeightPct = Math.min(100, Math.max(10, Math.abs(val) * 100));
            const barColor = val >= 0 ? 'bg-emerald-500' : 'bg-rose-500';

            return (
              <div key={day.date} className="flex flex-col items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{dayName}</span>
                <span className="text-[10px] text-slate-500 font-mono mb-2">{date.getDate()}</span>

                {/* Vertical bar */}
                <div className="w-3 bg-slate-800 h-16 rounded-full flex items-end p-0.5 overflow-hidden">
                  <div
                    className={`w-full rounded-full ${barColor}`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>

                <span className="text-[10px] font-mono text-cyan-300 mt-2">
                  {val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                </span>
                <span className="text-[9px] capitalize text-slate-400 mt-0.5 truncate max-w-full">
                  {day.dominantSentiment}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
