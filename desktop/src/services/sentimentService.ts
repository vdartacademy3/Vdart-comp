import { SentimentType } from '../stores/companionStore';
import { sentimentEngine, AnalysisOptions, SENTIMENT_MODEL_VERSION } from './sentiment/inference/sentimentEngine';
import { normalizeAndTokenize } from './sentiment/preprocessing/normalizer';
import { classifySentiment } from './sentiment/classifier/multilingualClassifier';
import { feedbackStore } from './sentiment/feedback/feedbackStore';
import { contextTracker } from './sentiment/context/contextTracker';
import { runBenchmarkEvaluation, BENCHMARK_DATASET } from './sentiment/evaluation/sentimentBenchmark';
import { 
  SentimentCategory, 
  SentimentPolarity, 
  SentimentPrediction, 
  SentimentFeedbackItem, 
  BenchmarkEvaluationResult,
  SpeechProsodySignals,
  UncertaintyLevel 
} from './sentiment/types';

export interface SentimentResult {
  sentiment: SentimentType;
  confidence: number;
  explanation?: string;
  uncertainty?: UncertaintyLevel;
  evidence?: string[];
  predictionId?: string;
}

/**
 * Fast local sentiment analysis using the unified multilingual normalizer & classifier
 */
export function analyzeSentimentLocal(text: string, options?: AnalysisOptions): SentimentResult {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { 
      sentiment: 'neutral', 
      confidence: 0.90,
      uncertainty: 'low',
      evidence: ['Baseline neutral state for empty input'] 
    };
  }

  const preprocessed = normalizeAndTokenize(trimmed);
  const result = classifySentiment(preprocessed);

  return {
    sentiment: result.primary_emotion as SentimentType,
    confidence: result.confidence,
    uncertainty: result.uncertainty,
    evidence: result.evidence,
    explanation: result.evidence.join('; '),
  };
}

/**
 * Full contextual and multi-signal sentiment analysis engine call
 */
export async function analyzeSentimentWithAI(
  text: string, 
  apiKey: string, 
  model = 'qwen/qwen3.8-27b',
  options?: Omit<AnalysisOptions, 'groqApiKey' | 'groqModel'>
): Promise<SentimentResult> {
  const prediction = await sentimentEngine.analyze(text, {
    ...options,
    groqApiKey: apiKey,
    groqModel: model,
    useGroqFallback: Boolean(apiKey && apiKey.trim().length > 0),
  });

  return {
    sentiment: prediction.primary_emotion as SentimentType,
    confidence: prediction.confidence,
    uncertainty: prediction.uncertainty,
    evidence: prediction.evidence,
    predictionId: prediction.id,
    explanation: prediction.evidence.join('; '),
  };
}

// Re-export core modules for use across dashboard, companion, and testing
export {
  sentimentEngine,
  feedbackStore,
  contextTracker,
  runBenchmarkEvaluation,
  BENCHMARK_DATASET,
  SENTIMENT_MODEL_VERSION,
};

export type {
  SentimentCategory,
  SentimentPolarity,
  SentimentPrediction,
  SentimentFeedbackItem,
  BenchmarkEvaluationResult,
  SpeechProsodySignals,
  UncertaintyLevel,
};
