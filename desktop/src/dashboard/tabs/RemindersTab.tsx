import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Check, 
  Clock, 
  Trash2, 
  Volume2, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { reminderService, ReminderItem, ReminderSettings } from '../../services/reminderService';

export const RemindersTab: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newMinutes, setNewMinutes] = useState(5);
  const [settings, setSettings] = useState<ReminderSettings>(reminderService.getSettings());

  useEffect(() => {
    setReminders(reminderService.getReminders());
    const unsub = reminderService.subscribe((list) => setReminders(list));
    return unsub;
  }, []);

  const handleAddReminder = (minsOffset: number = newMinutes) => {
    if (!newTitle.trim()) return;
    const dueTime = new Date(Date.now() + minsOffset * 60 * 1000);
    reminderService.addReminder({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      dueTime,
      priority: newPriority,
    });
    setNewTitle('');
    setNewDesc('');
  };

  const handleQuickAdd = (title: string, mins: number) => {
    reminderService.addReminder({
      title,
      dueTime: new Date(Date.now() + mins * 60 * 1000),
      priority: 'high',
    });
  };

  const handleComplete = (id: string) => {
    reminderService.completeReminder(id);
  };

  const handleSnooze = (id: string, mins: number) => {
    reminderService.snoozeReminder(id, mins);
  };

  const handleDelete = (id: string) => {
    reminderService.deleteReminder(id);
  };

  const handleToggleVoiceAnnounce = () => {
    const updated = { ...settings, enableSpeechAlerts: !settings.enableSpeechAlerts };
    reminderService.saveSettings(updated);
    setSettings(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          Smart Reminders & Spoken Voice Alerts
        </h3>
        <p className="text-xs text-slate-400">
          Scheduled notifications accompanied by physical robot desktop attention animations and spoken audio.
        </p>
      </div>

      {/* Add Reminder Form */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Schedule New Reminder
        </h4>

        <div className="flex flex-wrap gap-2.5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Reminder title (e.g. Engineering Standup, Drink water)..."
            className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Optional description..."
            className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 capitalize"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button
            onClick={() => handleAddReminder(5)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Set for in 5m
          </button>
        </div>

        {/* Quick Testing Presets */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 mr-1">Quick testing triggers:</span>
          <button
            onClick={() => handleQuickAdd('1-Minute Testing Check-in', 1)}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 text-cyan-300"
          >
            +1 Min Reminder
          </button>
          <button
            onClick={() => handleQuickAdd('Standup Meeting Reminder', 15)}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 text-slate-300"
          >
            +15 Min Meeting
          </button>
        </div>
      </div>

      {/* Voice Announcement Preference */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <div className="text-xs">
            <span className="font-semibold text-white block">Speak Reminders Aloud</span>
            <span className="text-[11px] text-slate-400">Robot announces reminder title using natural Indian voice output</span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.enableSpeechAlerts}
          onChange={handleToggleVoiceAnnounce}
          className="w-4 h-4 accent-cyan-500"
        />
      </div>

      {/* Reminders List */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Active & Scheduled Reminders ({reminders.length})</span>
          <span className="text-[11px] text-cyan-400">Desktop popup appears when due</span>
        </h4>

        {reminders.length > 0 ? (
          <div className="space-y-2">
            {reminders.map((r) => {
              const due = new Date(r.dueTime);
              const isOverdue = due.getTime() < Date.now() && r.status !== 'completed';
              return (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    isOverdue
                      ? 'bg-rose-950/30 border-rose-500/40'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="space-y-0.5 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{r.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                        r.priority === 'high' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {r.priority}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-rose-950 text-rose-300 border border-rose-500/40">
                          Due Now
                        </span>
                      )}
                    </div>
                    {r.description && <p className="text-[11px] text-slate-400">{r.description}</p>}
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Scheduled for: {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({due.toLocaleDateString()})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleComplete(r.id)}
                      className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-medium transition-colors"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => handleSnooze(r.id, 5)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => handleSnooze(r.id, 15)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic p-4">No pending reminders scheduled.</p>
        )}
      </div>
    </div>
  );
};
