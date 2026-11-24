import { SentimentCategory, SentimentFeedbackItem, SentimentPrediction } from '../types';

class FeedbackStore {
  private getStorageKey(userId: string): string {
    return `vcamp_sentiment_feedback_${userId || 'default'}`;
  }

  private getPredictionsKey(userId: string): string {
    return `vcamp_sentiment_predictions_${userId || 'default'}`;
  }

  public savePrediction(prediction: SentimentPrediction): void {
    try {
      const key = this.getPredictionsKey(prediction.userId);
      const list = this.getPredictions(prediction.userId);
      // Prepend recent prediction, keep up to 200
      const updated = [prediction, ...list.filter((p) => p.id !== prediction.id)].slice(0, 200);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('[FeedbackStore] Failed to save prediction to localStorage', err);
    }
  }

  public getPredictions(userId: string): SentimentPrediction[] {
    try {
      const key = this.getPredictionsKey(userId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) as SentimentPrediction[];
    } catch {
      return [];
    }
  }

  public submitFeedback(item: Omit<SentimentFeedbackItem, 'id' | 'timestamp'>): SentimentFeedbackItem {
    const feedbackItem: SentimentFeedbackItem = {
      ...item,
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Store feedback item
      const key = this.getStorageKey(item.userId);
      const existing = this.getFeedbackList(item.userId);
      const updated = [feedbackItem, ...existing];
      localStorage.setItem(key, JSON.stringify(updated));

      // 2. Mark prediction as user_corrected (without overwriting original prediction record)
      const predKey = this.getPredictionsKey(item.userId);
      const preds = this.getPredictions(item.userId);
      const targetPred = preds.find((p) => p.id === item.predictionId);
      if (targetPred) {
        targetPred.user_corrected = true;
        targetPred.corrected_emotion = item.correctedEmotion;
        targetPred.correction_notes = item.notes;
        localStorage.setItem(predKey, JSON.stringify(preds));
      }
    } catch (err) {
      console.warn('[FeedbackStore] Failed to submit feedback', err);
    }

    return feedbackItem;
  }

  public getFeedbackList(userId: string): SentimentFeedbackItem[] {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) as SentimentFeedbackItem[];
    } catch {
      return [];
    }
  }

  public getCorrectionStats(userId: string): { total: number; confirmed: number; corrected: number; userAgreementRate: number } {
    const list = this.getFeedbackList(userId);
    if (list.length === 0) {
      return { total: 0, confirmed: 0, corrected: 0, userAgreementRate: 1.0 };
    }
    const confirmed = list.filter((f) => f.feedbackType === 'confirmed_correct').length;
    const corrected = list.filter((f) => f.feedbackType === 'corrected').length;
    return {
      total: list.length,
      confirmed,
      corrected,
      userAgreementRate: Number((confirmed / list.length).toFixed(3)),
    };
  }

  public exportUserData(userId: string): string {
    const predictions = this.getPredictions(userId);
    const feedback = this.getFeedbackList(userId);
    return JSON.stringify({
      exportTimestamp: new Date().toISOString(),
      userId,
      predictionsCount: predictions.length,
      feedbackCount: feedback.length,
      predictions,
      feedback,
    }, null, 2);
  }

  public clearUserData(userId: string): void {
    localStorage.removeItem(this.getStorageKey(userId));
    localStorage.removeItem(this.getPredictionsKey(userId));
  }
}

export const feedbackStore = new FeedbackStore();
