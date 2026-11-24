export type SentimentCategory = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'frustrated' 
  | 'neutral' 
  | 'excited' 
  | 'confused' 
  | 'anxious' 
  | 'calm' 
  | 'disappointed' 
  | 'motivated' 
  | 'tired' 
  | 'stressed' 
  | 'curious' 
  | 'mixed'
  | 'ambiguous'
  | 'insufficient_evidence';

export type SentimentPolarity = 'positive' | 'negative' | 'neutral' | 'mixed';

export type UncertaintyLevel = 'low' | 'moderate' | 'high';

export type DetectedLanguage = 'en' | 'ta' | 'tanglish' | 'unknown';

export interface SpeechProsodySignals {
  speakingRateWpm?: number;
  pauseCount?: number;
  pitchVariation?: 'monotone' | 'normal' | 'expressive';
  energyLevel?: 'low' | 'moderate' | 'high';
  audioDurationSeconds?: number;
}

export interface SentimentPrediction {
  id: string;
  userId: string;
  primary_emotion: SentimentCategory;
  secondary_emotions: SentimentCategory[];
  sentiment_polarity: SentimentPolarity;
  confidence: number; // 0.00 to 1.00 calibrated
  uncertainty: UncertaintyLevel;
  evidence: string[];
  context_used: boolean;
  speech_prosody_used: boolean;
  language_detected: DetectedLanguage;
  model_version: string;
  timestamp: string; // ISO-8601
  raw_input?: string;
  user_corrected?: boolean;
  corrected_emotion?: SentimentCategory;
  correction_notes?: string;
}

export interface SentimentFeedbackItem {
  id: string;
  predictionId: string;
  userId: string;
  originalEmotion: SentimentCategory;
  correctedEmotion: SentimentCategory;
  feedbackType: 'confirmed_correct' | 'corrected' | 'flagged_ambiguous';
  notes?: string;
  timestamp: string;
  inputText: string;
  language: DetectedLanguage;
}

export interface BenchmarkSample {
  id: string;
  text: string;
  language: DetectedLanguage;
  groundTruthEmotion: SentimentCategory;
  groundTruthPolarity: SentimentPolarity;
  category: 'direct' | 'negation' | 'sarcasm' | 'mixed' | 'ambiguous' | 'tanglish' | 'tamil_script';
  notes?: string;
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface BenchmarkEvaluationResult {
  modelVersion: string;
  evaluationTimestamp: string;
  totalSamples: number;
  accuracy: number;
  macroF1: number;
  weightedF1: number;
  perClassMetrics: Record<string, ClassMetrics>;
  confusionMatrix: {
    classes: string[];
    matrix: number[][]; // matrix[true_idx][pred_idx]
  };
  languageBreakdown: Record<DetectedLanguage, {
    samples: number;
    accuracy: number;
    macroF1: number;
  }>;
  ambiguousRate: number;
  calibrationError: number;
}
