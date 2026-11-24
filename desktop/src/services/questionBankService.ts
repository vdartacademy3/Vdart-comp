import questionsData from '../data/questions_db.json';
import { SentimentType } from '../stores/companionStore';

export interface QuestionOption {
  key: string;
  text: string;
}

export interface QuestionItem {
  id: number;
  text: string;
  options: Record<string, string>;
  category: string;
  qualityScore: number;
  status: 'validated' | 'needs_review' | 'flagged';
  flags: string[];
  isActive: boolean;
}

export interface QuestionHistoryEntry {
  questionId: number;
  timestamp: string;
  action: 'answered' | 'skipped' | 'postponed';
  chosenOption?: string;
  customResponse?: string;
  associatedMood?: string;
}

export interface QuestionBankStats {
  total: number;
  validated: number;
  needsReview: number;
  flagged: number;
  categoryCounts: Record<string, number>;
}

// Map 17 Mood States to Preferred Question Categories
export const MOOD_TO_CATEGORIES: Record<string, string[]> = {
  stressed: ['Stress and Pressure', 'Workload', 'Workplace Support', 'Work-Life Balance'],
  frustrated: ['Workload', 'Communication', 'Workplace Support', 'Concentration'],
  sad: ['Emotional Wellbeing', 'Workplace Support', 'Workplace Satisfaction'],
  angry: ['Communication', 'Workplace Support', 'Workplace Satisfaction'],
  confused: ['Confidence', 'Communication', 'Learning and Growth'],
  tired: ['Work-Life Balance', 'Emotional Wellbeing', 'Workload'],
  happy: ['Motivation', 'Workplace Satisfaction', 'Recognition', 'Personal Goals'],
  excited: ['Motivation', 'Personal Goals', 'Recognition', 'Learning and Growth'],
  motivated: ['Personal Goals', 'Professional Development', 'Motivation', 'Learning and Growth'],
  neutral: ['Teamwork', 'Communication', 'Concentration', 'Workplace Satisfaction'],
  anxious: ['Stress and Pressure', 'Emotional Wellbeing', 'Workplace Support'],
  calm: ['Workplace Satisfaction', 'Emotional Wellbeing', 'Work-Life Balance'],
  disappointed: ['Recognition', 'Emotional Wellbeing', 'Workplace Support'],
  curious: ['Learning and Growth', 'Professional Development', 'Personal Goals'],
  mixed: ['Work-Life Balance', 'Workplace Support'],
  ambiguous: ['Emotional Wellbeing', 'Teamwork'],
  insufficient_evidence: ['Communication', 'Teamwork'],
};

export class QuestionBankService {
  private questions: QuestionItem[] = [];
  private stats: QuestionBankStats;

  constructor() {
    this.questions = (questionsData.questions as QuestionItem[]) || [];
    this.stats = {
      total: questionsData.totalQuestions || 2000,
      validated: questionsData.stats?.statusCounts?.validated || 1556,
      needsReview: questionsData.stats?.statusCounts?.needs_review || 151,
      flagged: questionsData.stats?.statusCounts?.flagged || 293,
      categoryCounts: questionsData.stats?.categoryCounts || {},
    };
  }

  public getStats(): QuestionBankStats {
    return this.stats;
  }

  public getCategories(): string[] {
    return Object.keys(this.stats.categoryCounts);
  }

  public filterQuestions(filter?: { category?: string; status?: string; search?: string; limit?: number }): QuestionItem[] {
    const list = this.getAllQuestions(filter);
    if (filter?.limit) {
      return list.slice(0, filter.limit);
    }
    return list;
  }

  public getAllQuestions(filter?: { category?: string; status?: string; search?: string }): QuestionItem[] {
    let result = this.questions;

    if (filter?.category && filter.category !== 'all') {
      result = result.filter(q => q.category === filter.category);
    }

    if (filter?.status && filter.status !== 'all') {
      result = result.filter(q => q.status === filter.status);
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      result = result.filter(q => 
        q.text.toLowerCase().includes(s) || 
        q.id.toString().includes(s) ||
        Object.values(q.options).some(o => o.toLowerCase().includes(s))
      );
    }

    return result;
  }

  public getQuestionById(id: number): QuestionItem | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Intelligently selects a relevant question based on user's current mood and history.
   * Only selects from validated questions, avoiding repeats.
   */
  public selectQuestionForContext(
    mood: string = 'neutral',
    askedQuestionIds: number[] = [],
    forcedCategory?: string
  ): QuestionItem | null {
    // Only use validated active questions
    let candidates = this.questions.filter(q => q.isActive);

    // Filter out previously asked questions to avoid repetition
    if (askedQuestionIds.length > 0) {
      const remaining = candidates.filter(q => !askedQuestionIds.includes(q.id));
      if (remaining.length > 0) {
        candidates = remaining;
      }
    }

    // If a specific category was requested
    if (forcedCategory && forcedCategory !== 'all') {
      const catMatches = candidates.filter(q => q.category === forcedCategory);
      if (catMatches.length > 0) {
        return catMatches[Math.floor(Math.random() * catMatches.length)];
      }
    }

    // Match categories based on mood
    const preferredCats = MOOD_TO_CATEGORIES[mood.toLowerCase()] || MOOD_TO_CATEGORIES.neutral;
    const moodMatched = candidates.filter(q => preferredCats.includes(q.category));

    if (moodMatched.length > 0) {
      return moodMatched[Math.floor(Math.random() * moodMatched.length)];
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    return null;
  }
}

export const questionBankService = new QuestionBankService();
