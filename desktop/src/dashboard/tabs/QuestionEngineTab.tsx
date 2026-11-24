import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Play, 
  Pause, 
  Clock, 
  Timer, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Layers,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { questionEngineService, QuestionEngineConfig } from '../../services/questionEngineService';
import { questionBankService, QuestionBankStats, MOOD_TO_CATEGORIES } from '../../services/questionBankService';
import { useCompanionStore } from '../../stores/companionStore';

export const QuestionEngineTab: React.FC = () => {
  const { sentiment } = useCompanionStore();
  const [config, setConfig] = useState<QuestionEngineConfig>(questionEngineService.getConfig());
  const [stats, setStats] = useState<QuestionBankStats>(questionBankService.getStats());
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(questionEngineService.getSecondsUntilNext());
  const [activeQuestion, setActiveQuestion] = useState(questionEngineService.getActiveQuestion());

  useEffect(() => {
    const unsub = questionEngineService.subscribe((s) => {
      setConfig(questionEngineService.getConfig());
      setActiveQuestion(s.question);
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

  const handleUpdateInterval = (sec: number) => {
    questionEngineService.setIntervalSeconds(sec);
    setConfig(questionEngineService.getConfig());
  };

  const handleTogglePause = () => {
    questionEngineService.togglePause();
    setConfig(questionEngineService.getConfig());
  };

  const handleToggleAuto = () => {
    questionEngineService.toggleAutoEnabled();
    setConfig(questionEngineService.getConfig());
  };

  const handleAskNow = () => {
    questionEngineService.triggerQuestion(true);
  };

  const handleSkip = () => {
    questionEngineService.skip();
  };

  const currentMood = sentiment || 'neutral';
  const prioritizedCats = MOOD_TO_CATEGORIES[currentMood] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          Question Engine & 2-Minute Testing Scheduler
        </h3>
        <p className="text-xs text-slate-400">
          Automated sentiment check-in scheduler drawing from the 2,000-question contextual psychometric bank.
        </p>
      </div>

      {/* Module 1: 2-Minute Testing Controls */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            Testing Schedule Configuration
          </h4>
          <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            Current Interval: {config.intervalSeconds}s ({config.intervalSeconds / 60}m)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Countdown to Next Question</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">{secondsUntilNext}s</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {config.isPaused ? 'Engine is paused' : 'Background scheduler active'}
            </span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Automation Status</span>
            <span className={`text-base font-bold capitalize block ${config.isAutoEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              {config.isAutoEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleToggleAuto}
              className="text-xs text-cyan-400 hover:underline mt-1 block"
            >
              {config.isAutoEnabled ? 'Disable Auto Questions' : 'Enable Auto Questions'}
            </button>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Pause / Resume</span>
            <span className={`text-base font-bold capitalize block ${config.isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
              {config.isPaused ? 'Paused' : 'Running'}
            </span>
            <button
              onClick={handleTogglePause}
              className="text-xs text-cyan-400 hover:underline mt-1 block"
            >
              {config.isPaused ? 'Resume Scheduler' : 'Pause Scheduler'}
            </button>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Active Question</span>
            <span className="text-sm font-semibold text-white truncate block">
              {activeQuestion ? activeQuestion.text : 'None active'}
            </span>
            {activeQuestion && (
              <button
                onClick={handleSkip}
                className="text-xs text-amber-400 hover:underline mt-1 block"
              >
                Skip This Question
              </button>
            )}
          </div>
        </div>

        {/* Interval Selector */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-slate-300 block mb-2">Preset Interval Controls:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { sec: 30, label: '30 Seconds (Rapid)' },
              { sec: 60, label: '60 Seconds (1 Min)' },
              { sec: 120, label: '120 Seconds (2 Min - Testing Target)', activeTarget: true },
              { sec: 300, label: '5 Minutes' },
              { sec: 900, label: '15 Minutes' },
            ].map((p) => {
              const isSelected = config.intervalSeconds === p.sec;
              return (
                <button
                  key={p.sec}
                  onClick={() => handleUpdateInterval(p.sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={handleAskNow}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Trigger Question Immediately Beside Robot
          </button>
          <button
            onClick={handleTogglePause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            {config.isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            {config.isPaused ? 'Resume Questions' : 'Pause Questions'}
          </button>
        </div>
      </div>

      {/* Sentiment-Aware Prioritization Preview */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Sentiment-Driven Question Recommendation Engine
        </h4>
        <p className="text-xs text-slate-400">
          When the user exhibits emotional stress, frustration, or fatigue, the engine dynamically prioritizes supportive wellbeing check-ins over routine productivity prompts.
        </p>

        <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Companion Sentiment:</span>
            <span className="font-bold text-cyan-400 capitalize">{currentMood}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Prioritized Question Categories:</span>
            <span className="font-semibold text-emerald-400">
              {prioritizedCats.length > 0 ? prioritizedCats.join(', ') : 'General Check-ins'}
            </span>
          </div>
        </div>
      </div>

      {/* Bank Stats */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Question Bank Statistics</span>
          <span className="text-cyan-400 font-mono text-[11px]">{stats.total} Total Questions Loaded</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          {Object.entries(stats.categoryCounts).slice(0, 8).map(([cat, count]) => (
            <div key={cat} className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block truncate">{cat}</span>
              <span className="font-bold text-white text-sm mt-0.5 block">{count} questions</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
