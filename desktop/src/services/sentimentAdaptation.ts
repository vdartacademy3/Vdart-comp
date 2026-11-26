import { CanonicalAnimationState } from '../characters/types';
import { SentimentType, RobotEmotion, useCompanionStore } from '../stores/companionStore';
import { animationController } from './animationController';
import { moodTimelineService } from './moodTimelineService';

export type ContextCategory =
  | 'workload'
  | 'stress'
  | 'frustration'
  | 'motivation'
  | 'anxiety'
  | 'sadness'
  | 'confusion'
  | 'positive'
  | 'general';

export interface AdaptationDecision {
  emotion: RobotEmotion;
  animationState: CanonicalAnimationState;
  contextCategory: ContextCategory;
  guidance: string;
}

const WORKLOAD_REGEX = /\b(workload|deadline|deadlines|overtime|too much work|overwhelmed|backlog|hectic|pressure|buried)\b/i;

export function classifyContextCategory(text: string, sentiment: SentimentType): ContextCategory {
  if (WORKLOAD_REGEX.test(text || '')) return 'workload';
  if (sentiment === 'stressed' || sentiment === 'tired') return 'stress';
  if (sentiment === 'frustrated' || sentiment === 'angry' || sentiment === 'disappointed') return 'frustration';
  if (sentiment === 'anxious') return 'anxiety';
  if (sentiment === 'sad') return 'sadness';
  if (sentiment === 'confused') return 'confusion';
  if (sentiment === 'motivated') return 'motivation';
  if (sentiment === 'happy' || sentiment === 'excited' || sentiment === 'calm') return 'positive';
  return 'general';
}

/**
 * Maps verified sentiment context to calibrated character adaptation without overreacting
 * to isolated sentences:
 * - Positive -> friendly happy expression + subtle IDLE/WAVE
 * - Stress/Workload -> calm supportive expression, stays in calm IDLE (no excessive animation)
 * - Frustration -> neutral attentive expression, stays in IDLE
 * - Neutral -> default IDLE
 */
export function applySentimentAdaptation(text: string, sentiment: SentimentType): AdaptationDecision {
  const category = classifyContextCategory(text, sentiment);
  const store = useCompanionStore.getState();

  if (category === 'positive' || category === 'motivation') {
    store.setEmotion('happy', 4500);
    return {
      emotion: 'happy',
      animationState: 'IDLE',
      contextCategory: category,
      guidance: 'Positive context: warm expression, subtle gesture',
    };
  }

  if (category === 'workload' || category === 'stress' || category === 'anxiety' || category === 'sadness') {
    store.setEmotion('calm', 5000);
    // Avoid excessive animations when user is stressed or overloaded
    if (animationController.getState().activeState !== 'TALK') {
      animationController.returnToIdle('ai');
    }
    return {
      emotion: 'calm',
      animationState: 'IDLE',
      contextCategory: category,
      guidance: 'Stress/workload context: calm response, avoid excessive animations',
    };
  }

  if (category === 'frustration' || category === 'confusion') {
    store.setEmotion('attentive', 4500);
    return {
      emotion: 'attentive',
      animationState: 'IDLE',
      contextCategory: category,
      guidance: 'Frustration context: neutral attentive posture, listen carefully',
    };
  }

  store.setEmotion('neutral');
  return {
    emotion: 'neutral',
    animationState: 'IDLE',
    contextCategory: 'general',
    guidance: 'Neutral context: default IDLE state',
  };
}

export interface ContextualQuestionPrompt {
  key: string;
  text: string;
  context: ContextCategory;
  options: string[];
}

const PATTERN_QUESTION_MAP: Partial<Record<ContextCategory, ContextualQuestionPrompt>> = {
  workload: {
    key: 'pattern_workload',
    text: 'Has your workload been difficult recently?',
    context: 'workload',
    options: ['Yes, deadlines are tight', 'Busy, but manageable', 'No, workload is balanced'],
  },
  stress: {
    key: 'pattern_motivation',
    text: 'Is anything affecting your motivation or energy today?',
    context: 'motivation',
    options: ['Heavy tasks or fatigue', 'Unclear priorities', 'All good overall'],
  },
  frustration: {
    key: 'pattern_frustration',
    text: "Would you like to talk about what's bothering you?",
    context: 'frustration',
    options: ["Yes, let's break it down", 'Just needed to vent', 'Skip for now'],
  },
  positive: {
    key: 'pattern_positive',
    text: 'What went well today?',
    context: 'positive',
    options: ['Completed an important goal', 'Great team collaboration', 'Steady focus'],
  },
};

const PATTERN_LAST_ASKED_KEY = 'vcamp_pattern_q_last_asked';
const PATTERN_DAILY_KEY = 'vcamp_pattern_q_daily';

export function evaluatePatternQuestionTrigger(consentEnabled: boolean, quietHoursActive: boolean): ContextualQuestionPrompt | null {
  if (!consentEnabled || quietHoursActive) return null;

  try {
    const now = Date.now();
    const lastAsked = parseInt(localStorage.getItem(PATTERN_LAST_ASKED_KEY) || '0', 10);
    // 2-hour cooldown so we never repeatedly interrogate users
    if (now - lastAsked < 120 * 60 * 1000) return null;

    const today = new Date().toISOString().split('T')[0];
    const dailyRaw = localStorage.getItem(PATTERN_DAILY_KEY);
    if (dailyRaw) {
      const parsed = JSON.parse(dailyRaw);
      if (parsed.date === today && (parsed.count || 0) >= 3) return null;
    }

    const recent = moodTimelineService.getEntries().slice(0, 5);
    if (recent.length < 2) return null;

    const workloadHits = recent.filter((e) =>
      e.detectedSentiment === 'stressed' ||
      (e.triggerContext && WORKLOAD_REGEX.test(e.triggerContext))
    ).length;
    const frustrationHits = recent.filter((e) =>
      e.detectedSentiment === 'frustrated' || e.detectedSentiment === 'angry'
    ).length;
    const fatigueHits = recent.filter((e) =>
      e.detectedSentiment === 'tired' || e.detectedSentiment === 'disappointed'
    ).length;
    const positiveHits = recent.filter((e) =>
      e.detectedSentiment === 'happy' || e.detectedSentiment === 'excited' || e.detectedSentiment === 'motivated'
    ).length;

    let prompt: ContextualQuestionPrompt | undefined;
    if (workloadHits >= 2) prompt = PATTERN_QUESTION_MAP.workload;
    else if (frustrationHits >= 2) prompt = PATTERN_QUESTION_MAP.frustration;
    else if (fatigueHits >= 2) prompt = PATTERN_QUESTION_MAP.stress;
    else if (positiveHits >= 3) prompt = PATTERN_QUESTION_MAP.positive;

    if (!prompt) return null;
    return prompt;
  } catch {
    return null;
  }
}

export function markPatternQuestionShown(): void {
  try {
    const now = Date.now();
    localStorage.setItem(PATTERN_LAST_ASKED_KEY, String(now));
    const today = new Date().toISOString().split('T')[0];
    const dailyRaw = localStorage.getItem(PATTERN_DAILY_KEY);
    const prev = dailyRaw ? JSON.parse(dailyRaw) : { date: today, count: 0 };
    const count = prev.date === today ? (prev.count || 0) + 1 : 1;
    localStorage.setItem(PATTERN_DAILY_KEY, JSON.stringify({ date: today, count }));
  } catch {}
}
