import { SentimentCategory, SentimentPrediction } from '../types';

export interface ContextWindowItem {
  timestamp: string;
  speaker: 'user' | 'assistant';
  text: string;
  predictedEmotion?: SentimentCategory;
  confidence?: number;
}

export interface SentimentTrajectory {
  direction: 'improving' | 'declining' | 'stable' | 'volatile' | 'insufficient_data';
  dominantRecentEmotion: SentimentCategory;
  inertiaWeight: number; // 0.0 to 0.4
  historyLength: number;
}

class ContextTracker {
  private userContexts: Map<string, ContextWindowItem[]> = new Map();
  private readonly MAX_WINDOW = 10;

  public addInteraction(
    userId: string, 
    speaker: 'user' | 'assistant', 
    text: string, 
    prediction?: SentimentPrediction
  ): void {
    const history = this.userContexts.get(userId) || [];
    const item: ContextWindowItem = {
      timestamp: new Date().toISOString(),
      speaker,
      text,
      predictedEmotion: prediction?.primary_emotion,
      confidence: prediction?.confidence,
    };
    history.push(item);
    if (history.length > this.MAX_WINDOW) {
      history.shift();
    }
    this.userContexts.set(userId, history);
  }

  public getContextWindow(userId: string): ContextWindowItem[] {
    return this.userContexts.get(userId) || [];
  }

  public getRecentUserPredictions(userId: string): SentimentCategory[] {
    const history = this.userContexts.get(userId) || [];
    return history
      .filter((h) => h.speaker === 'user' && h.predictedEmotion)
      .map((h) => h.predictedEmotion as SentimentCategory);
  }

  public getTrajectory(userId: string): SentimentTrajectory {
    const userEmotions = this.getRecentUserPredictions(userId);
    if (userEmotions.length < 2) {
      return {
        direction: 'insufficient_data',
        dominantRecentEmotion: userEmotions[userEmotions.length - 1] || 'neutral',
        inertiaWeight: 0,
        historyLength: userEmotions.length,
      };
    }

    const polarityScores: Record<SentimentCategory, number> = {
      excited: 2,
      happy: 1.5,
      motivated: 1.5,
      calm: 1,
      curious: 0.5,
      neutral: 0,
      ambiguous: 0,
      insufficient_evidence: 0,
      mixed: 0,
      tired: -0.8,
      confused: -0.8,
      disappointed: -1.2,
      anxious: -1.5,
      stressed: -1.5,
      frustrated: -1.8,
      sad: -2,
      angry: -2,
    };

    const recentScores = userEmotions.slice(-4).map((e) => polarityScores[e] ?? 0);
    const scoreDiff = recentScores[recentScores.length - 1] - recentScores[0];

    let direction: 'improving' | 'declining' | 'stable' | 'volatile' = 'stable';
    if (scoreDiff >= 1.0) direction = 'improving';
    else if (scoreDiff <= -1.0) direction = 'declining';
    else {
      // Check volatility
      let flips = 0;
      for (let i = 1; i < recentScores.length; i++) {
        if ((recentScores[i] > 0 && recentScores[i - 1] < 0) || (recentScores[i] < 0 && recentScores[i - 1] > 0)) {
          flips++;
        }
      }
      if (flips >= 2) direction = 'volatile';
    }

    // Dominant recent emotion
    const freq: Partial<Record<SentimentCategory, number>> = {};
    for (const em of userEmotions.slice(-3)) {
      freq[em] = (freq[em] || 0) + 1;
    }
    let dominantRecentEmotion: SentimentCategory = userEmotions[userEmotions.length - 1];
    let maxCount = 0;
    for (const [em, count] of Object.entries(freq)) {
      if ((count as number) > maxCount) {
        maxCount = count as number;
        dominantRecentEmotion = em as SentimentCategory;
      }
    }

    // Emotional inertia: stronger if persistent negative or positive
    const inertiaWeight = Math.min(0.35, maxCount * 0.12);

    return {
      direction,
      dominantRecentEmotion,
      inertiaWeight,
      historyLength: userEmotions.length,
    };
  }

  public clear(userId?: string): void {
    if (userId) {
      this.userContexts.delete(userId);
    } else {
      this.userContexts.clear();
    }
  }
}

export const contextTracker = new ContextTracker();
