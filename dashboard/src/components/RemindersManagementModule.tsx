import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  Bell,
  Plus,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
  RefreshCw,
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
      setSuccess('Reminder scheduled.');
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1769D2]" /> Reminders & Task Scheduling
          </h2>
          <p className="text-xs text-[#64748B]">
            Scheduled companion reminders synced across sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white font-semibold text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
          <button
            onClick={fetchReminders}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#64748B]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-3">
        {reminders.map((r) => (
          <div
            key={r.id}
            className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 bg-white shadow-sm ${
              r.is_completed ? 'border-slate-200 opacity-65' : 'border-slate-200 hover:border-[#1769D2]/40'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => handleToggleComplete(r)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  r.is_completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 hover:border-[#1769D2]'
                }`}
              >
                {r.is_completed && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>

              <div className="min-w-0">
                <div className={`text-xs font-semibold text-[#172B4D] ${r.is_completed ? 'line-through text-[#64748B]' : ''}`}>
                  {r.title}
                </div>
                <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#1769D2]" />
                    {new Date(r.due_time).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {r.is_smart_detected && (
                    <span className="text-[#1769D2] flex items-center gap-0.5 font-medium">
                      <Sparkles className="w-3 h-3" /> Smart Detected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  r.priority === 'high'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : r.priority === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-[#64748B] border-slate-200'
                }`}
              >
                {r.priority}
              </span>

              <button
                onClick={() => handleDelete(r.id)}
                className="p-1 text-[#64748B] hover:text-red-600 transition-colors"
                title="Delete reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {reminders.length === 0 && !loading && (
          <div className="py-12 text-center text-[#64748B] text-xs bg-white border border-slate-200 rounded-xl">
            No active reminders scheduled.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1769D2]" /> Create Scheduled Reminder
            </h3>

            <form onSubmit={handleAddReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Daily Standup Sync"
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
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
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[#64748B] hover:text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white font-semibold text-xs"
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
