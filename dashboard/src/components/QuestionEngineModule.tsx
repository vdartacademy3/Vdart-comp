import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  HelpCircle,
  Search,
  Clock,
  Send,
  CheckCircle2,
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
    const matchesSearch =
      q.text?.toLowerCase().includes(search.toLowerCase()) ||
      q.text_tamil?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleTestTrigger = (q: any) => {
    setScheduledSuccess(`Previewed prompt: "${q.text}"`);
    setTimeout(() => setScheduledSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#1769D2]" /> Contextual Question Engine
        </h2>
        <p className="text-xs text-[#64748B]">
          Supportive reflection check-ins in English and Tamil with cooldown and quiet-hour safeguards.
        </p>
      </div>

      {scheduledSuccess && (
        <div className="p-3 rounded-lg bg-[#EAF3FF] border border-[#1769D2]/20 text-[#172B4D] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1769D2]" />
          <span>{scheduledSuccess}</span>
        </div>
      )}

      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1769D2]" /> Check-in Cadence Preference
        </h3>
        <div className="flex flex-wrap items-center gap-5 text-xs text-[#172B4D]">
          {[
            { val: '30min', label: 'Every 30 Minutes' },
            { val: 'hourly', label: 'Hourly (Recommended)' },
            { val: 'daily', label: 'Daily Check-in' },
          ].map((opt) => (
            <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cadence"
                value={opt.val}
                checked={frequency === opt.val}
                onChange={() => setFrequency(opt.val)}
                className="accent-[#1769D2]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions in English or Tamil..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-[#172B4D] placeholder-slate-400 outline-none focus:border-[#1769D2]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {defaultCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1769D2] text-white'
                  : 'bg-white text-[#64748B] hover:text-[#172B4D] border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#1769D2]/40 transition-colors flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769D2] border border-[#1769D2]/20">
                  {q.category}
                </span>
                <span className="text-xs font-semibold text-[#172B4D]">{q.text}</span>
              </div>
              {q.text_tamil && (
                <div className="text-[11px] text-[#64748B] pl-1">{q.text_tamil}</div>
              )}
            </div>

            <button
              onClick={() => handleTestTrigger(q)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF3FF] hover:bg-[#1769D2] text-[#1769D2] hover:text-white text-xs font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-[#64748B] text-xs bg-white border border-slate-200 rounded-xl">
            No questions matching your query.
          </div>
        )}
      </div>
    </div>
  );
};
