import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  Trash2,
  TrendingUp,
  AlertCircle,
  Search,
} from 'lucide-react';
import { moodTimelineService, MoodEntry } from '../../services/moodTimelineService';
import { analyzeSentimentLocal } from '../../services/sentimentService';
import { classifyContextCategory } from '../../services/sentimentAdaptation';
import { userProfileService } from '../../services/userProfileService';
import { SentimentType, useCompanionStore } from '../../stores/companionStore';

export const SentimentWellbeingTab: React.FC = () => {
  const { setSentiment } = useCompanionStore();
  const [entries, setEntries] = useState<MoodEntry[]>(() => moodTimelineService.getEntries());
  const [profile, setProfile] = useState(() => userProfileService.getActiveProfile());
  const [probeText, setProbeText] = useState('');
  const [probeResult, setProbeResult] = useState<{
    sentiment: SentimentType;
    confidence: number;
    context: string;
  } | null>(null);

  useEffect(() => {
    return moodTimelineService.subscribe((next) => setEntries(next));
  }, []);

  const handleToggleConsent = (enabled: boolean) => {
    const updated = { ...profile, enableMoodTracking: enabled };
    userProfileService.saveProfile(updated);
    setProfile(updated);
  };

  const handleAnalyzeProbe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!probeText.trim()) return;
    const res = analyzeSentimentLocal(probeText);
    const context = classifyContextCategory(probeText, res.sentiment);
    setProbeResult({
      sentiment: res.sentiment,
      confidence: res.confidence,
      context,
    });
    if (profile.enableMoodTracking) {
      moodTimelineService.recordMood(res.sentiment, res.confidence, probeText);
      setSentiment(res.sentiment, res.confidence);
    }
  };

  const handleClearHistory = () => {
    moodTimelineService.clearHistory();
  };

  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    const key = e.userReportedSentiment || e.detectedSentiment;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const dailySummaries = moodTimelineService.getDailySummaries(7);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-vcamp-primary" />
            Sentiment Status &amp; Wellbeing Timeline
          </h3>
          <p className="text-xs text-vcamp-muted">
            Transparent, consent-based sentiment context analysis. Not a medical diagnosis or employee surveillance tool.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-vcamp-border text-xs font-semibold text-vcamp-text cursor-pointer">
            <input
              type="checkbox"
              checked={profile.enableMoodTracking}
              onChange={(e) => handleToggleConsent(e.target.checked)}
              className="accent-vcamp-primary"
            />
            <span>Consent: Store Sentiment Context</span>
          </label>
          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-vcamp-error"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete History
          </button>
        </div>
      </div>

      {/* Consent Notice */}
      <div className="p-3.5 rounded-2xl bg-vcamp-secondary border border-blue-200 flex items-start gap-2.5 text-xs text-vcamp-text">
        <ShieldCheck className="w-4 h-4 text-vcamp-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Sentiment classification helps VCamp adapt its conversational tone calmly (for example, avoiding excessive animations during workload stress). You control whether records are saved and can delete them anytime.
        </p>
      </div>

      {/* Interactive Classifier Probe */}
      <form
        onSubmit={handleAnalyzeProbe}
        className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3"
      >
        <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-4 h-4 text-vcamp-primary" />
          Test Multilingual Sentiment &amp; Context Classifier
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={probeText}
            onChange={(e) => setProbeText(e.target.value)}
            placeholder="Enter English, Tamil, or Tanglish text (e.g. 'Deadlines are tight and workload is heavy')..."
            className="flex-1 px-3 py-2 rounded-xl border border-vcamp-border text-xs text-vcamp-text outline-none focus:border-vcamp-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white text-xs font-semibold"
          >
            Analyze
          </button>
        </div>

        {probeResult && (
          <div className="p-3 rounded-xl bg-slate-50 border border-vcamp-border flex flex-wrap items-center gap-4 text-xs">
            <span>
              Emotion: <strong className="text-vcamp-primary capitalize">{probeResult.sentiment}</strong>
            </span>
            <span>
              Confidence: <strong>{Math.round(probeResult.confidence * 100)}%</strong>
            </span>
            <span>
              Context Category: <strong className="capitalize">{probeResult.context}</strong>
            </span>
          </div>
        )}
      </form>

      {/* Distribution + 7-Day Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3">
          <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider">
            Emotion Distribution ({entries.length} records)
          </h4>
          {Object.keys(counts).length === 0 ? (
            <p className="text-xs text-vcamp-muted py-6 text-center">
              No consented sentiment records yet.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, count]) => {
                  const pct = Math.round((count / entries.length) * 100);
                  return (
                    <div key={emotion} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="capitalize font-medium text-vcamp-text">{emotion}</span>
                        <span className="text-vcamp-muted font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-vcamp-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3">
          <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-vcamp-primary" />
            7-Day Temporal Trend
          </h4>
          <div className="space-y-2 text-xs">
            {dailySummaries.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-vcamp-border"
              >
                <span className="font-mono text-vcamp-muted">{day.date}</span>
                <span className="capitalize font-semibold text-vcamp-text">
                  {day.totalEntries > 0 ? day.dominantSentiment : 'No entries'}
                </span>
                <span className="text-[11px] font-mono text-vcamp-primary">
                  {day.totalEntries} msgs • Valence {day.averageValence >= 0 ? '+' : ''}
                  {day.averageValence}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3">
        <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider">
          Recent Records (Timestamp &amp; Context)
        </h4>
        {entries.length === 0 ? (
          <div className="text-xs text-vcamp-muted py-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> History is empty.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {entries.slice(0, 25).map((e) => (
              <div
                key={e.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-vcamp-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-vcamp-text truncate font-medium">
                    {e.triggerContext || 'Conversation turn'}
                  </p>
                  <span className="text-[10px] text-vcamp-muted">
                    {new Date(e.timestamp).toLocaleString()} • Workload: {e.signals.workload}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-vcamp-secondary text-vcamp-primary font-semibold capitalize shrink-0">
                  {e.userReportedSentiment || e.detectedSentiment} ({Math.round(e.confidence * 100)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
