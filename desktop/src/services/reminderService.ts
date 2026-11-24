import { useCompanionStore } from '../stores/companionStore';
import { speechService } from './speechService';
import { userProfileService } from './userProfileService';
import { desktopMovementService } from './desktopMovementService';

export interface ReminderItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueTime: string; // ISO 8601 string
  priority: 'low' | 'medium' | 'high';
  recurring: 'none' | 'daily' | 'weekly';
  status: 'pending' | 'completed' | 'snoozed' | 'dismissed';
  createdAt: string;
  snoozedUntil?: string;
  isOverdue?: boolean;
  conversationalPrompt?: string;
}

export interface ReminderSettings {
  dndEnabled: boolean;
  dndStart: string; // e.g., "22:00"
  dndEnd: string;   // e.g., "08:00"
  enableSpeechAlerts: boolean;
  enableNotificationSound: boolean;
  snoozeDefaultMinutes: number;
}

const STORAGE_KEY = 'vcamp_smart_reminders';
const SETTINGS_KEY = 'vcamp_reminder_settings';

class ReminderService {
  private reminders: ReminderItem[] = [];
  private settings: ReminderSettings = {
    dndEnabled: false,
    dndStart: '22:00',
    dndEnd: '08:00',
    enableSpeechAlerts: true,
    enableNotificationSound: true,
    snoozeDefaultMinutes: 5,
  };
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: ((reminders: ReminderItem[]) => void)[] = [];
  private alertListeners: ((alert: ReminderItem | null) => void)[] = [];
  
  // Alert queue for handling multiple reminders firing simultaneously
  private currentActiveAlert: ReminderItem | null = null;
  private alertQueue: ReminderItem[] = [];

  constructor() {
    this.load();
    this.startBackgroundCheck();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.reminders = JSON.parse(stored);
      }
      const set = localStorage.getItem(SETTINGS_KEY);
      if (set) {
        this.settings = { ...this.settings, ...JSON.parse(set) };
      }
    } catch {}
    this.checkOverdueOnStartup();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reminders));
    } catch {}
    this.notify();
  }

  public saveSettings(settings: Partial<ReminderSettings>) {
    this.settings = { ...this.settings, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {}
  }

  public getSettings(): ReminderSettings {
    return { ...this.settings };
  }

  public subscribe(cb: (reminders: ReminderItem[]) => void): () => void {
    this.listeners.push(cb);
    cb(this.getReminders());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public onAlert(cb: (alert: ReminderItem | null) => void): () => void {
    this.alertListeners.push(cb);
    cb(this.currentActiveAlert);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const list = this.getReminders();
    this.listeners.forEach((cb) => cb(list));
  }

  private dispatchAlert(alert: ReminderItem | null) {
    this.currentActiveAlert = alert;
    this.alertListeners.forEach((cb) => cb(alert));
  }

  public getReminders(userId?: string): ReminderItem[] {
    const activeUserId = userId || userProfileService.getActiveProfile().id;
    return this.reminders
      .filter((r) => r.userId === activeUserId)
      .sort((a, b) => new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime());
  }

  public addReminder(data: {
    title: string;
    description?: string;
    dueTime: string | Date;
    priority?: 'low' | 'medium' | 'high';
    recurring?: 'none' | 'daily' | 'weekly';
    userId?: string;
  }): ReminderItem {
    const activeUserId = data.userId || userProfileService.getActiveProfile().id;
    const isoDue = typeof data.dueTime === 'string' ? data.dueTime : data.dueTime.toISOString();

    const reminder: ReminderItem = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: activeUserId,
      title: data.title.trim(),
      description: data.description?.trim(),
      dueTime: isoDue,
      priority: data.priority || 'medium',
      recurring: data.recurring || 'none',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.reminders.push(reminder);
    this.save();
    return reminder;
  }

  /**
   * Natural Language Parser: parses expressions like:
   * "remind me in 10 minutes to submit the daily standup notes"
   * "remind me at 4:30 pm to take medicine"
   * "remind me tomorrow at 9am to check team emails"
   */
  public parseNaturalLanguage(input: string): { title: string; dueTime: Date; priority: 'low' | 'medium' | 'high' } | null {
    const text = input.trim();
    if (!text) return null;

    let targetDate = new Date();
    let title = text;
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (/\b(urgent|important|asap|critical)\b/i.test(text)) {
      priority = 'high';
    } else if (/\b(whenever|low priority|someday|eventually)\b/i.test(text)) {
      priority = 'low';
    }

    // Pattern 1: "in X minutes / hours / secs"
    const inMatch = text.match(/\bin\s+(\d+)\s*(mins?|minutes?|hours?|hrs?|secs?|seconds?)\b/i);
    if (inMatch) {
      const amount = parseInt(inMatch[1], 10);
      const unit = inMatch[2].toLowerCase();
      let ms = 0;
      if (unit.startsWith('sec')) ms = amount * 1000;
      else if (unit.startsWith('hour') || unit.startsWith('hr')) ms = amount * 3600 * 1000;
      else ms = amount * 60 * 1000;

      targetDate = new Date(Date.now() + ms);
      title = text
        .replace(/\bremind(\s+me)?(\s+to)?\b/i, '')
        .replace(inMatch[0], '')
        .replace(/\bto\s+/i, '')
        .trim();
      return { title: title || 'Quick Reminder', dueTime: targetDate, priority };
    }

    // Pattern 2: "at 4:30 pm" or "at 16:00" or "at 5pm"
    const atMatch = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (atMatch) {
      let hours = parseInt(atMatch[1], 10);
      const mins = atMatch[2] ? parseInt(atMatch[2], 10) : 0;
      const meridiem = atMatch[3]?.toLowerCase();

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      targetDate.setHours(hours, mins, 0, 0);

      // If specified time has already passed today, assume tomorrow
      if (targetDate.getTime() <= Date.now()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      title = text
        .replace(/\bremind(\s+me)?(\s+to)?\b/i, '')
        .replace(atMatch[0], '')
        .replace(/\bto\s+/i, '')
        .trim();
      return { title: title || 'Scheduled Reminder', dueTime: targetDate, priority };
    }

    // Pattern 3: "tomorrow at ..."
    if (/\btomorrow\b/i.test(text)) {
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(9, 0, 0, 0); // default 9:00 AM tomorrow
      title = text
        .replace(/\bremind(\s+me)?(\s+to)?\b/i, '')
        .replace(/\btomorrow\b/i, '')
        .replace(/\bto\s+/i, '')
        .trim();
      return { title: title || 'Tomorrow Task', dueTime: targetDate, priority };
    }

    return null;
  }

  public completeReminder(id: string) {
    const rem = this.reminders.find((r) => r.id === id);
    if (!rem) return;

    if (rem.recurring === 'daily') {
      const nextDate = new Date(rem.dueTime);
      nextDate.setDate(nextDate.getDate() + 1);
      rem.dueTime = nextDate.toISOString();
      rem.status = 'pending';
      rem.isOverdue = false;
    } else if (rem.recurring === 'weekly') {
      const nextDate = new Date(rem.dueTime);
      nextDate.setDate(nextDate.getDate() + 7);
      rem.dueTime = nextDate.toISOString();
      rem.status = 'pending';
      rem.isOverdue = false;
    } else {
      rem.status = 'completed';
      rem.isOverdue = false;
    }
    this.save();

    // Reward feedback: companion expresses cheer
    const store = useCompanionStore.getState();
    store.setEmotion('proud', 3500);
    store.triggerAction('play', 3000);

    // If currently alerted, clear it and process next
    if (this.currentActiveAlert?.id === id) {
      this.processNextAlert();
    }
  }

  public snoozeReminder(id: string, minutes: number = 5) {
    const rem = this.reminders.find((r) => r.id === id);
    if (!rem) return;

    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    rem.status = 'snoozed';
    rem.snoozedUntil = snoozeUntil;
    rem.dueTime = snoozeUntil;
    rem.isOverdue = false;
    this.save();

    const store = useCompanionStore.getState();
    store.setEmotion('gentle', 2500);

    // Speak snooze confirmation
    if (!this.isQuietHours() && this.settings.enableSpeechAlerts && store.autoSpeak) {
      speechService.speak(`Understood. I will remind you again in ${minutes} minutes.`, {
        rate: store.speechRate,
        pitch: store.speechPitch,
      });
    }

    if (this.currentActiveAlert?.id === id) {
      this.processNextAlert();
    }
  }

  public rescheduleReminder(id: string, newDueIso: string) {
    const rem = this.reminders.find((r) => r.id === id);
    if (!rem) return;

    rem.dueTime = newDueIso;
    rem.status = 'pending';
    rem.isOverdue = false;
    delete rem.snoozedUntil;
    this.save();

    const store = useCompanionStore.getState();
    store.setEmotion('calm', 2500);

    if (this.currentActiveAlert?.id === id) {
      this.processNextAlert();
    }
  }

  public dismissReminder(id: string) {
    const rem = this.reminders.find((r) => r.id === id);
    if (!rem) return;

    rem.status = 'dismissed';
    rem.isOverdue = false;
    this.save();

    if (this.currentActiveAlert?.id === id) {
      this.processNextAlert();
    }
  }

  public deleteReminder(id: string) {
    this.reminders = this.reminders.filter((r) => r.id !== id);
    this.save();

    if (this.currentActiveAlert?.id === id) {
      this.processNextAlert();
    }
  }

  private processNextAlert() {
    if (this.alertQueue.length > 0) {
      const nextAlert = this.alertQueue.shift()!;
      this.triggerReminderAlert(nextAlert);
    } else {
      this.dispatchAlert(null);
    }
  }

  private isQuietHours(): boolean {
    if (!this.settings.dndEnabled) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = this.settings.dndStart.split(':').map((v) => parseInt(v, 10));
    const [endH, endM] = this.settings.dndEnd.split(':').map((v) => parseInt(v, 10));

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentMins >= startTotal && currentMins < endTotal;
    } else {
      // Over midnight (e.g. 22:00 to 08:00)
      return currentMins >= startTotal || currentMins < endTotal;
    }
  }

  /**
   * Generates natural conversational phrasing tailored to time-of-day,
   * user profile name, and language preferences.
   */
  public generateConversationalAnnouncement(reminder: ReminderItem): string {
    const profile = userProfileService.getActiveProfile();
    const userName = profile?.name && profile.name !== 'Default User' ? profile.name : 'there';
    const store = useCompanionStore.getState();
    const lang = store.activeLanguage;

    const hour = new Date().getHours();
    let timeGreeting = 'Hello';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (lang === 'ta') {
      return `வணக்கம் ${userName}! உங்களுக்கான நினைவூட்டல் நேரம் வந்துவிட்டது: ${reminder.title}. இப்போது முடிக்கவா அல்லது சிறிது நேரம் கழித்து நினைவூட்டவா?`;
    }

    if (lang === 'tanglish') {
      return `Vanakkam ${userName}! Unga reminder time vandhuruchu: ${reminder.title}. Ippa mudikiringala illa 15 mins snooze pannava?`;
    }

    // Natural Indian English phrasing
    if (reminder.priority === 'high') {
      return `Hey ${userName}, high priority reminder! It's time for "${reminder.title}". Are you ready to take care of this now?`;
    }

    return `${timeGreeting} ${userName}! Quick reminder: it is time for "${reminder.title}". Would you like to mark it done or snooze?`;
  }

  /**
   * Spoken Voice Command Parser for Reminders
   * Interprets transcripts like: "done", "mark done", "snooze 15 minutes", "dismiss"
   */
  public handleVoiceCommand(transcript: string, reminderId: string): { 
    handled: boolean; 
    action?: 'done' | 'snooze' | 'dismiss'; 
    feedback?: string 
  } {
    const text = transcript.toLowerCase().trim();
    if (!text) return { handled: false };

    // Done commands
    if (/\b(done|complete|completed|finish|finished|did it|i finished|mudichiten|aachchu)\b/i.test(text)) {
      this.completeReminder(reminderId);
      return { handled: true, action: 'done', feedback: 'Great job! Reminder marked as completed.' };
    }

    // Snooze commands with optional minute parsing
    if (/\b(snooze|later|remind me later|afterwards|apram|snooze pannu)\b/i.test(text)) {
      let minutes = 5;
      const numMatch = text.match(/\b(\d+)\s*(mins?|minutes?)?\b/i);
      if (numMatch) {
        minutes = parseInt(numMatch[1], 10);
      } else if (text.includes('15') || text.includes('fifteen')) {
        minutes = 15;
      } else if (text.includes('30') || text.includes('half an hour')) {
        minutes = 30;
      }
      this.snoozeReminder(reminderId, minutes);
      return { handled: true, action: 'snooze', feedback: `Snoozed for ${minutes} minutes.` };
    }

    // Dismiss commands
    if (/\b(dismiss|cancel|close|ignore|vendaam)\b/i.test(text)) {
      this.dismissReminder(reminderId);
      return { handled: true, action: 'dismiss', feedback: 'Reminder dismissed.' };
    }

    return { handled: false };
  }

  private triggerReminderAlert(reminder: ReminderItem) {
    // If another alert is currently showing on the desktop, queue this one
    if (this.currentActiveAlert && this.currentActiveAlert.id !== reminder.id) {
      if (!this.alertQueue.some((q) => q.id === reminder.id)) {
        this.alertQueue.push(reminder);
      }
      return;
    }

    // 1. Immediately halt any roaming desktop movement so robot stops walking
    desktopMovementService.stopMovement();

    // 2. Wake companion if sleeping
    const store = useCompanionStore.getState();
    if (store.isSleeping) {
      store.setIsSleeping(false);
    }

    // 3. Physically restore, unhide, and focus Tauri native window
    if (typeof window !== 'undefined' && (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/core')
        .then(({ invoke }) => {
          invoke('restore_and_focus_companion').catch(() => {});
        })
        .catch(() => {});
    }

    // 4. Trigger robot attentive emotion & greeting wave animation
    store.setEmotion('attentive', 8000);
    store.triggerAction('greet', 3500);

    // 5. Generate warm conversational reminder phrasing
    const conversationalText = this.generateConversationalAnnouncement(reminder);
    reminder.conversationalPrompt = conversationalText;

    // 6. Play futuristic notification chime and announce via natural Indian TTS
    const quiet = this.isQuietHours();
    if (!quiet) {
      if (this.settings.enableNotificationSound) {
        speechService.playNotificationChime();
      }

      if (this.settings.enableSpeechAlerts && store.autoSpeak) {
        // Slight delay so the chime finishes before speech starts
        setTimeout(() => {
          speechService.speak(conversationalText, {
            rate: store.speechRate,
            pitch: store.speechPitch,
            voiceName: store.speechVoice,
          });
        }, 380);
      }
    }

    // 7. Dispatch to UI to open interactive Reminder Conversation Bubble beside robot
    this.dispatchAlert(reminder);
  }

  private checkOverdueOnStartup() {
    const now = Date.now();
    let hasOverdue = false;
    this.reminders.forEach((r) => {
      if ((r.status === 'pending' || r.status === 'snoozed') && new Date(r.dueTime).getTime() < now) {
        r.isOverdue = true;
        hasOverdue = true;
      }
    });
    if (hasOverdue) {
      this.save();
    }
  }

  private startBackgroundCheck() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const now = Date.now();
      this.reminders.forEach((r) => {
        if (r.status === 'pending' || r.status === 'snoozed') {
          const due = new Date(r.dueTime).getTime();
          // Trigger when dueTime <= now
          if (due <= now && !r.isOverdue) {
            r.isOverdue = true;
            this.triggerReminderAlert(r);
            this.save();
          }
        }
      });
    }, 2000); // Check every 2 seconds for high responsiveness
  }
}

export const reminderService = new ReminderService();
