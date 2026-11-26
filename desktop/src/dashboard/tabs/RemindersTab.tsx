import React, { useState, useEffect } from 'react';
import { Bell, Plus, Check, Clock, Trash2, Volume2 } from 'lucide-react';
import { reminderService, ReminderItem, ReminderSettings } from '../../services/reminderService';

export const RemindersTab: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [settings, setSettings] = useState<ReminderSettings>(reminderService.getSettings());

  useEffect(() => {
    setReminders(reminderService.getReminders());
    return reminderService.subscribe((list) => setReminders(list));
  }, []);

  const handleAddReminder = (minsOffset: number) => {
    if (!newTitle.trim()) return;
    reminderService.addReminder({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      dueTime: new Date(Date.now() + minsOffset * 60 * 1000),
      priority: newPriority,
    });
    setNewTitle('');
    setNewDesc('');
  };

  const handleToggleVoiceAnnounce = () => {
    const updated = { ...settings, enableSpeechAlerts: !settings.enableSpeechAlerts };
    reminderService.saveSettings(updated);
    setSettings(updated);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
            <Bell className="w-5 h-5 text-vcamp-primary" />
            Smart Reminders &amp; Alerts
          </h3>
          <p className="text-xs text-vcamp-muted">
            Schedule reminders via UI or natural chat commands (e.g. &ldquo;Remind me in 15 minutes&rdquo;).
          </p>
        </div>

        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-vcamp-border text-xs font-semibold text-vcamp-text cursor-pointer">
          <Volume2 className="w-3.5 h-3.5 text-vcamp-primary" />
          <input
            type="checkbox"
            checked={settings.enableSpeechAlerts}
            onChange={handleToggleVoiceAnnounce}
            className="accent-vcamp-primary"
          />
          <span>Spoken Alerts</span>
        </label>
      </div>

      {/* Add Form */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3">
        <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider">
          New Reminder
        </h4>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Reminder title..."
            className="flex-1 min-w-[200px] bg-white border border-vcamp-border rounded-xl px-3 py-2 text-xs text-vcamp-text outline-none focus:border-vcamp-primary"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 min-w-[160px] bg-white border border-vcamp-border rounded-xl px-3 py-2 text-xs text-vcamp-text outline-none focus:border-vcamp-primary"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="bg-white border border-vcamp-border rounded-xl px-3 py-2 text-xs text-vcamp-text outline-none focus:border-vcamp-primary"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            type="button"
            onClick={() => handleAddReminder(5)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-vcamp-primary hover:bg-vcamp-primaryHover text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Add (5m)
          </button>
        </div>
      </div>

      {/* Reminder List */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-2.5">
        <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider">
          Scheduled Reminders ({reminders.length})
        </h4>
        {reminders.length === 0 ? (
          <p className="text-xs text-vcamp-muted py-4 text-center">No reminders scheduled.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-slate-50 border border-vcamp-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-vcamp-text truncate">{r.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        r.status === 'completed'
                          ? 'bg-emerald-50 text-vcamp-success border border-emerald-200'
                          : 'bg-vcamp-secondary text-vcamp-primary border border-blue-200'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-vcamp-muted mt-0.5">
                    Due: {new Date(r.dueTime).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {r.status !== 'completed' && (
                    <>
                      <button
                        type="button"
                        onClick={() => reminderService.completeReminder(r.id)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-vcamp-success hover:bg-emerald-100"
                        title="Complete"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => reminderService.snoozeReminder(r.id, 10)}
                        className="p-1.5 rounded-lg bg-vcamp-secondary text-vcamp-primary hover:bg-blue-100"
                        title="Snooze 10m"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => reminderService.deleteReminder(r.id)}
                    className="p-1.5 rounded-lg bg-red-50 text-vcamp-error hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
