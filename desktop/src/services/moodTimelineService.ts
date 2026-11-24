import { SentimentType } from '../stores/companionStore';
import { userProfileService } from './userProfileService';

export interface MoodSignals {
  valence: number;      // -1.0 (very negative) to +1.0 (very positive)
  intensity: number;    // 0.0 (calm) to 1.0 (intense)
  confidence: number;   // 0.0 to 1.0
  workload: 'light' | 'moderate' | 'heavy';
  motivation: 'low' | 'moderate' | 'high';
  support: 'needs_support' | 'neutral' | 'supported';
}

export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: string; // ISO 8601
  detectedSentiment: SentimentType;
  userReportedSentiment?: SentimentType;
  confidence: number;
  signals: MoodSignals;
  triggerContext?: string;
}

export interface DailyMoodSummary {
  date: string; // YYYY-MM-DD
  dominantSentiment: SentimentType;
  averageValence: number;
  sentimentCounts: Record<SentimentType, number>;
  totalEntries: number;
}

const STORAGE_KEY = 'vcamp_mood_timeline';

// Default signal profiles for all 17 sentiment states
export const SENTIMENT_SIGNAL_DEFAULTS: Record<SentimentType, { valence: number; intensity: number }> = {
  happy: { valence: 0.8, intensity: 0.7 },
  excited: { valence: 0.95, intensity: 0.95 },
  motivated: { valence: 0.85, intensity: 0.8 },
  neutral: { valence: 0.0, intensity: 0.2 },
  confused: { valence: -0.1, intensity: 0.4 },
  tired: { valence: -0.4, intensity: 0.3 },
  stressed: { valence: -0.7, intensity: 0.85 },
  frustrated: { valence: -0.75, intensity: 0.8 },
  sad: { valence: -0.85, intensity: 0.6 },
  angry: { valence: -0.9, intensity: 0.95 },
  anxious: { valence: -0.65, intensity: 0.8 },
  calm: { valence: 0.7, intensity: 0.25 },
  disappointed: { valence: -0.6, intensity: 0.5 },
  curious: { valence: 0.3, intensity: 0.5 },
  mixed: { valence: 0.0, intensity: 0.6 },
  ambiguous: { valence: 0.0, intensity: 0.3 },
  insufficient_evidence: { valence: 0.0, intensity: 0.1 },
};

class MoodTimelineService {
  private entries: MoodEntry[] = [];
  private listeners: ((entries: MoodEntry[]) => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw);
      }
    } catch {}
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {}
    this.notify();
  }

  public subscribe(cb: (entries: MoodEntry[]) => void): () => void {
    this.listeners.push(cb);
    cb(this.getEntries());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const list = this.getEntries();
    this.listeners.forEach((cb) => cb(list));
  }

  public getEntries(userId?: string): MoodEntry[] {
    const activeUserId = userId || userProfileService.getActiveProfile().id;
    return this.entries
      .filter((e) => e.userId === activeUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordMood(
    sentiment: SentimentType,
    confidence: number = 0.85,
    triggerContext?: string,
    customSignals?: Partial<MoodSignals>
  ): MoodEntry {
    const activeUserId = userProfileService.getActiveProfile().id;
    const defaults = SENTIMENT_SIGNAL_DEFAULTS[sentiment] || { valence: 0.0, intensity: 0.2 };

    let workload: 'light' | 'moderate' | 'heavy' = 'moderate';
    if (sentiment === 'stressed' || sentiment === 'frustrated' || sentiment === 'tired') {
      workload = 'heavy';
    } else if (sentiment === 'happy' || sentiment === 'excited') {
      workload = 'light';
    }

    let motivation: 'low' | 'moderate' | 'high' = 'moderate';
    if (sentiment === 'motivated' || sentiment === 'excited') {
      motivation = 'high';
    } else if (sentiment === 'tired' || sentiment === 'sad') {
      motivation = 'low';
    }

    let support: 'needs_support' | 'neutral' | 'supported' = 'neutral';
    if (sentiment === 'stressed' || sentiment === 'frustrated' || sentiment === 'confused' || sentiment === 'sad') {
      support = 'needs_support';
    } else if (sentiment === 'happy' || sentiment === 'motivated') {
      support = 'supported';
    }

    const signals: MoodSignals = {
      valence: customSignals?.valence ?? defaults.valence,
      intensity: customSignals?.intensity ?? defaults.intensity,
      confidence,
      workload: customSignals?.workload ?? workload,
      motivation: customSignals?.motivation ?? motivation,
      support: customSignals?.support ?? support,
    };

    const entry: MoodEntry = {
      id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: activeUserId,
      timestamp: new Date().toISOString(),
      detectedSentiment: sentiment,
      confidence,
      signals,
      triggerContext,
    };

    this.entries.push(entry);
    this.save();
    return entry;
  }

  public reportUserMood(sentiment: SentimentType, notes?: string): MoodEntry {
    const entry = this.recordMood(sentiment, 1.0, notes ? `User logged: ${notes}` : 'User self-reported mood');
    entry.userReportedSentiment = sentiment;
    this.save();
    return entry;
  }

  public getDailySummaries(days: number = 7, userId?: string): DailyMoodSummary[] {
    const list = this.getEntries(userId);
    const summaries: Map<string, DailyMoodSummary> = new Map();

    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      summaries.set(dateStr, {
        date: dateStr,
        dominantSentiment: 'neutral',
        averageValence: 0,
        sentimentCounts: {
          happy: 0,
          excited: 0,
          motivated: 0,
          neutral: 0,
          confused: 0,
          tired: 0,
          stressed: 0,
          frustrated: 0,
          sad: 0,
          angry: 0,
          anxious: 0,
          calm: 0,
          disappointed: 0,
          curious: 0,
          mixed: 0,
          ambiguous: 0,
          insufficient_evidence: 0,
        },
        totalEntries: 0,
      });
    }

    list.forEach((entry) => {
      const dateStr = entry.timestamp.split('T')[0];
      const summary = summaries.get(dateStr);
      if (summary) {
        summary.totalEntries += 1;
        const s = entry.userReportedSentiment || entry.detectedSentiment;
        summary.sentimentCounts[s] = (summary.sentimentCounts[s] || 0) + 1;
        summary.averageValence += entry.signals.valence;
      }
    });

    return Array.from(summaries.values()).map((s) => {
      if (s.totalEntries > 0) {
        s.averageValence = Number((s.averageValence / s.totalEntries).toFixed(2));
        let maxCount = -1;
        let dominant: SentimentType = 'neutral';
        for (const [sentiment, count] of Object.entries(s.sentimentCounts) as [SentimentType, number][]) {
          if (count > maxCount) {
            maxCount = count;
            dominant = sentiment;
          }
        }
        s.dominantSentiment = dominant;
      }
      return s;
    });
  }

  public clearHistory(userId?: string) {
    const activeUserId = userId || userProfileService.getActiveProfile().id;
    this.entries = this.entries.filter((e) => e.userId !== activeUserId);
    this.save();
  }
}

export const moodTimelineService = new MoodTimelineService();
