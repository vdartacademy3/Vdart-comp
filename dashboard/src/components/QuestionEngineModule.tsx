import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  HelpCircle, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  Send, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

export const QuestionEngineModule: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [frequency, setFrequency] = useState('hourly');
  const [scheduledSuccess, setScheduledSuccess] = useState<string | null>(null);

  const defaultCategories = ['all', 'wellbeing', 'stress', 'workload', 'motivation', 'team'];

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await apiClient.get('/system/questions');
        if (Array.isArray(data)) {
          setQuestions(data);
        }
      } catch (e) {
        console.warn('Failed to load questions from backend:', e);
      }
    };
    fetchQuestions();
  }, []);

  const filtered = questions.filter((q) => {
    const matchesCat = selectedCategory === 'all' || q.category?.toLowerCase() === selectedCategory;
    const matchesSearch = q.text?.toLowerCase().includes(search.toLowerCase()) || 
                          q.text_tamil?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleTestTrigger = (q: any) => {
    setScheduledSuccess(`Triggered prompt: "${q.text}"`);
    setTimeout(() => setScheduledSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" /> Psychology & Sentiment Question Engine
          </h2>
          <p className="text-xs text-slate-400">
            Scientifically calibrated affective check-ins in English and Tamil Unicode to proactively gauge employee well-being.
          </p>
        </div>
      </div>

      {scheduledSuccess && (
        <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scheduledSuccess}</span>
        </div>
      )}

      {/* Scheduler Configuration */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> Check-in Cadence & Frequency
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cadence"
              value="30min"
              checked={frequency === '30min'}
              onChange={() => setFrequency('30min')}
              className="accent-cyan-500"
            />
            <span className="text-slate-300">Every 30 Minutes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cadence"
              value="hourly"
              checked={frequency === 'hourly'}
              onChange={() => setFrequency('hourly')}
              className="accent-cyan-500"
            />
            <span className="text-slate-300">Hourly (Recommended)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cadence"
              value="daily"
              checked={frequency === 'daily'}
              onChange={() => setFrequency('daily')}
              className="accent-cyan-500"
            />
            <span className="text-slate-300">Daily Standup Check</span>
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions in English or Tamil..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {defaultCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2.5">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {q.category}
                </span>
                <span className="text-xs font-semibold text-white">{q.text}</span>
              </div>
              {q.text_tamil && (
                <div className="text-[11px] text-slate-400 font-sans pl-1">
                  {q.text_tamil}
                </div>
              )}
            </div>

            <button
              onClick={() => handleTestTrigger(q)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium transition-colors"
              title="Test companion speech bubble"
            >
              <Send className="w-3.5 h-3.5" /> Trigger
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-slate-500 text-xs">
            No questions matching your query.
          </div>
        )}
      </div>
    </div>
  );
};
