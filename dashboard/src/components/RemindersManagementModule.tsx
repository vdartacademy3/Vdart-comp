import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  Bell, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const RemindersManagementModule: React.FC = () => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [success, setSuccess] = useState<string | null>(null);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/reminders');
      if (Array.isArray(data)) {
        setReminders(data);
      }
    } catch (e) {
      console.warn('Failed to load reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await apiClient.post('/reminders', {
        title: newTitle.trim(),
        due_time: newDate ? new Date(newDate).toISOString() : new Date(Date.now() + 3600000).toISOString(),
        priority: newPriority,
      });
      setSuccess('Reminder scheduled!');
      setNewTitle('');
      setNewDate('');
      setShowAddModal(false);
      fetchReminders();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (r: any) => {
    try {
      await apiClient.put(`/reminders/${r.id}`, {
        is_completed: !r.is_completed,
      });
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/reminders/${id}`);
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" /> Reminders & Proactive Task Scheduling
          </h2>
          <p className="text-xs text-slate-400">
            Smart natural language reminders parsed from chat and user-scheduled companion notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/30"
          >
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
          <button
            onClick={fetchReminders}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.map((r) => (
          <div
            key={r.id}
            className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
              r.is_completed
                ? 'bg-slate-950/50 border-slate-800/60 opacity-60'
                : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/30'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => handleToggleComplete(r)}
                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                  r.is_completed
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'border-slate-600 hover:border-cyan-400'
                }`}
              >
                {r.is_completed && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <div className="min-w-0">
                <div className={`text-xs font-semibold text-white ${r.is_completed ? 'line-through text-slate-400' : ''}`}>
                  {r.title}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {new Date(r.due_time).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {r.is_smart_detected && (
                    <span className="text-cyan-400 flex items-center gap-0.5 font-medium">
                      <Sparkles className="w-3 h-3" /> Smart Detected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  r.priority === 'high'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    : r.priority === 'medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {r.priority}
              </span>

              <button
                onClick={() => handleDelete(r.id)}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="Delete reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {reminders.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No active reminders scheduled. Add one above or say "Remind me at 4 PM to drink water" in desktop companion chat!
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" /> Create Scheduled Reminder
            </h3>

            <form onSubmit={handleAddReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Daily Standup Sync"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
