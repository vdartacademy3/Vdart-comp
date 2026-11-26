import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  Sparkles,
  SkipForward,
} from 'lucide-react';
import { questionEngineService, QuestionEngineConfig } from '../../services/questionEngineService';
import { questionBankService, MOOD_TO_CATEGORIES } from '../../services/questionBankService';
import { userProfileService } from '../../services/userProfileService';
import { useCompanionStore } from '../../stores/companionStore';

export const QuestionEngineTab: React.FC = () => {
  const { sentiment } = useCompanionStore();
  const [config, setConfig] = useState<QuestionEngineConfig>(questionEngineService.getConfig());
  const [stats] = useState(() => questionBankService.getStats());
  const [profile, setProfile] = useState(() => userProfileService.getActiveProfile());
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(
    questionEngineService.getSecondsUntilNext()
  );

  useEffect(() => {
    const unsub = questionEngineService.subscribe((s) => {
      setConfig(questionEngineService.getConfig());
      setSecondsUntilNext(s.secondsUntilNext);
    });
    const timer = setInterval(() => {
      setSecondsUntilNext(questionEngineService.getSecondsUntilNext());
    }, 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const handleToggleConsent = (enabled: boolean) => {
    const updated = { ...profile, enableQuestions: enabled };
    userProfileService.saveProfile(updated);
    setProfile(updated);
    if (!enabled && config.isAutoEnabled) {
      questionEngineService.toggleAutoEnabled();
    } else if (enabled && !config.isAutoEnabled) {
      questionEngineService.toggleAutoEnabled();
    }
    setConfig(questionEngineService.getConfig());
  };

  const handleToggleQuietHours = (enabled: boolean) => {
    questionEngineService.saveConfig({ quietHoursEnabled: enabled });
    setConfig(questionEngineService.getConfig());
  };

  const currentMood = sentiment || 'neutral';
  const prioritizedCats = MOOD_TO_CATEGORIES[currentMood] || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-vcamp-primary" />
            Intelligent Question Engine
          </h3>
          <p className="text-xs text-vcamp-muted">
            Non-intrusive, consent-based check-ins triggered by meaningful conversational patterns with cooldowns &amp; quiet hours.
          </p>
        </div>

        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-vcamp-border text-xs font-semibold text-vcamp-text cursor-pointer">
          <input
            type="checkbox"
            checked={profile.enableQuestions}
            onChange={(e) => handleToggleConsent(e.target.checked)}
            className="accent-vcamp-primary"
          />
          <span>Consent: Store Question Responses</span>
        </label>
      </div>

      <div className="p-3.5 rounded-2xl bg-vcamp-secondary border border-blue-200 flex items-start gap-2.5 text-xs text-vcamp-text">
        <ShieldCheck className="w-4 h-4 text-vcamp-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Pattern-based check-ins (workload, motivation, frustration, positive reflection) enforce a 2-hour cooldown, daily limit, quiet hours, and one-click skip so your focus is never interrupted.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card">
          <span className="text-[10px] font-bold uppercase text-vcamp-muted">Status</span>
          <p
            className={`text-base font-bold mt-1 ${
              config.isPaused || !config.isAutoEnabled ? 'text-vcamp-warning' : 'text-vcamp-success'
            }`}
          >
            {!config.isAutoEnabled ? 'Disabled' : config.isPaused ? 'Paused' : 'Active'}
          </p>
          <p className="text-[11px] text-vcamp-muted mt-1">
            {secondsUntilNext >= 0 ? `Next check-in in ${secondsUntilNext}s` : 'Auto scheduler paused'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card">
          <span className="text-[10px] font-bold uppercase text-vcamp-muted">Cadence Interval</span>
          <p className="text-base font-bold text-vcamp-text mt-1">
            {Math.round(config.intervalSeconds / 60)} min
          </p>
          <div className="flex gap-1 mt-2">
            {[
              { label: '2m', sec: 120 },
              { label: '30m', sec: 1800 },
              { label: '60m', sec: 3600 },
            ].map((p) => (
              <button
                key={p.sec}
                type="button"
                onClick={() => {
                  questionEngineService.setIntervalSeconds(p.sec);
                  setConfig(questionEngineService.getConfig());
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  config.intervalSeconds === p.sec
                    ? 'bg-vcamp-secondary border-vcamp-primary text-vcamp-primary'
                    : 'bg-white border-vcamp-border text-vcamp-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card">
          <span className="text-[10px] font-bold uppercase text-vcamp-muted">Quiet Hours</span>
          <p className="text-base font-bold text-vcamp-text mt-1">
            {config.quietHoursStart} – {config.quietHoursEnd}
          </p>
          <label className="flex items-center gap-1.5 text-[11px] text-vcamp-muted mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.quietHoursEnabled}
              onChange={(e) => handleToggleQuietHours(e.target.checked)}
              className="accent-vcamp-primary"
            />
            Respect Quiet Hours
          </label>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card">
          <span className="text-[10px] font-bold uppercase text-vcamp-muted">Question Bank</span>
          <p className="text-base font-bold text-vcamp-primary mt-1">{stats.total} Questions</p>
          <p className="text-[11px] text-vcamp-muted mt-1">
            {stats.validated} validated across categories
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => questionEngineService.triggerQuestion(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask Check-in Now
        </button>

        <button
          type="button"
          onClick={() => {
            questionEngineService.togglePause();
            setConfig(questionEngineService.getConfig());
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-vcamp-border text-xs font-semibold text-vcamp-text"
        >
          {config.isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 text-vcamp-success" />
              Resume Scheduler
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-vcamp-warning" />
              Pause Scheduler
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => questionEngineService.skip()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-vcamp-border text-xs font-semibold text-vcamp-muted"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip Active Question
        </button>
      </div>

      {/* Context Mapping */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-2.5">
        <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-vcamp-primary" />
          Context-Aware Category Selection (Current State: {currentMood})
        </h4>
        <div className="flex flex-wrap gap-2">
          {prioritizedCats.map((cat) => (
            <span
              key={cat}
              className="px-2.5 py-1 rounded-full bg-vcamp-secondary text-vcamp-primary border border-blue-200 text-xs font-medium"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
