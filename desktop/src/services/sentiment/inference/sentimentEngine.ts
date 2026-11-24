import { normalizeAndTokenize } from '../preprocessing/normalizer';
import { classifySentiment, ClassifierResult } from '../classifier/multilingualClassifier';
import { contextTracker } from '../context/contextTracker';
import { feedbackStore } from '../feedback/feedbackStore';
import { 
  DetectedLanguage, 
  SentimentCategory, 
  SentimentPolarity, 
  SentimentPrediction, 
  SpeechProsodySignals, 
  UncertaintyLevel 
} from '../types';

export const SENTIMENT_MODEL_VERSION = 'vcamp-sentiment-v2.1';

export interface AnalysisOptions {
  userId?: string;
  useGroqFallback?: boolean;
  groqApiKey?: string;
  groqModel?: string;
  speechProsody?: SpeechProsodySignals;
}

class SentimentEngine {
  private lastPredictions: Map<string, SentimentPrediction> = new Map();

  /**
   * Main inference method strictly returning a validated SentimentPrediction
   */
  public async analyze(
    rawText: string,
    options: AnalysisOptions = {}
  ): Promise<SentimentPrediction> {
    const userId = options.userId || 'default_user';
    const trimmed = (rawText || '').trim();
    const timestamp = new Date().toISOString();
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Edge case: Empty or too short
    if (!trimmed || trimmed.length < 2) {
      const pred: SentimentPrediction = {
        id: predictionId,
        userId,
        primary_emotion: 'insufficient_evidence',
        secondary_emotions: [],
        sentiment_polarity: 'neutral',
        confidence: 0.20,
        uncertainty: 'high',
        evidence: ['Input contains insufficient textual content (<2 characters)'],
        context_used: false,
        speech_prosody_used: false,
        language_detected: 'unknown',
        model_version: SENTIMENT_MODEL_VERSION,
        timestamp,
        raw_input: rawText,
      };
      this.persistPrediction(pred, userId);
      return pred;
    }

    // 1. Preprocessing & Multilingual Normalization
    const preprocessed = normalizeAndTokenize(trimmed);
    const language: DetectedLanguage = preprocessed.language;

    // 2. Rule & Lexicon-based classification
    const classResult: ClassifierResult = classifySentiment(preprocessed);

    let primaryEmotion: SentimentCategory = classResult.primary_emotion;
    let secondaryEmotions: SentimentCategory[] = [...classResult.secondary_emotions];
    let polarity: SentimentPolarity = classResult.sentiment_polarity;
    let confidence: number = classResult.confidence;
    let uncertainty: UncertaintyLevel = classResult.uncertainty;
    const evidence: string[] = [...classResult.evidence];
    let contextUsed = false;
    let speechProsodyUsed = false;

    // 3. Context & Emotional Inertia Integration
    const trajectory = contextTracker.getTrajectory(userId);
    if (trajectory.historyLength > 0) {
      contextUsed = true;
      // If current input is brief/vague ("ok", "fine", "hmm", "seri") but previous context had strong inertia
      const isBriefVague = preprocessed.tokens.length <= 3 && (primaryEmotion === 'neutral' || primaryEmotion === 'ambiguous');
      if (isBriefVague && trajectory.inertiaWeight > 0.15) {
        evidence.push(`Conversational inertia: Lingering ${trajectory.dominantRecentEmotion} emotional state from prior turns (weight: ${trajectory.inertiaWeight.toFixed(2)})`);
        if (!secondaryEmotions.includes(trajectory.dominantRecentEmotion)) {
          secondaryEmotions.push(trajectory.dominantRecentEmotion);
        }
      } else {
        evidence.push(`Recent emotional trajectory: ${trajectory.direction} (dominant: ${trajectory.dominantRecentEmotion})`);
      }
    }

    // 4. Speech Prosody Integration (with scientific disclaimer)
    if (options.speechProsody && (options.speechProsody.speakingRateWpm || options.speechProsody.energyLevel)) {
      speechProsodyUsed = true;
      const { speakingRateWpm, energyLevel, pitchVariation, pauseCount } = options.speechProsody;
      
      const prosodyCues: string[] = [];
      if (speakingRateWpm) prosodyCues.push(`Speech rate: ${speakingRateWpm} wpm`);
      if (energyLevel) prosodyCues.push(`Energy: ${energyLevel}`);
      if (pitchVariation) prosodyCues.push(`Pitch: ${pitchVariation}`);
      if (pauseCount !== undefined) prosodyCues.push(`Hesitation pauses: ${pauseCount}`);

      // Corroboration logic
      if (energyLevel === 'high' && speakingRateWpm && speakingRateWpm > 165) {
        if (primaryEmotion === 'neutral' || primaryEmotion === 'ambiguous') {
          primaryEmotion = 'excited';
          confidence = Math.max(confidence, 0.65);
          uncertainty = 'moderate';
        }
        evidence.push(`Speech acoustic signals (${prosodyCues.join(', ')}) suggest high arousal [Disclaimer: Acoustic features corroborate, but do not replace semantic ground truth]`);
      } else if (energyLevel === 'low' && speakingRateWpm && speakingRateWpm < 105) {
        if (primaryEmotion === 'neutral' || primaryEmotion === 'ambiguous') {
          primaryEmotion = 'tired';
          confidence = Math.max(confidence, 0.60);
          uncertainty = 'moderate';
        }
        evidence.push(`Speech acoustic signals (${prosodyCues.join(', ')}) indicate low arousal/fatigue [Disclaimer: Acoustic features corroborate, but do not replace semantic ground truth]`);
      } else {
        evidence.push(`Speech prosody recorded: ${prosodyCues.join(', ')}`);
      }
    }

    // 5. Optional LLM fallback for high uncertainty or ambiguous queries
    if (
      options.useGroqFallback && 
      options.groqApiKey && 
      (uncertainty === 'high' || primaryEmotion === 'ambiguous') &&
      trimmed.length > 8
    ) {
      try {
        const groqResult = await this.queryGroqSentiment(trimmed, options.groqApiKey, options.groqModel);
        if (groqResult) {
          if (groqResult.primary_emotion) {
            primaryEmotion = groqResult.primary_emotion;
          }
          secondaryEmotions = groqResult.secondary_emotions || secondaryEmotions;
          polarity = groqResult.sentiment_polarity || polarity;
          confidence = Number(Math.min(0.95, Math.max(0.40, groqResult.confidence || confidence)).toFixed(2));
          uncertainty = groqResult.uncertainty || 'moderate';
          if (groqResult.evidence && Array.isArray(groqResult.evidence)) {
            evidence.push(...groqResult.evidence.map((e) => `[LLM Reasoner] ${e}`));
          }
        }
      } catch (err) {
        console.warn('[SentimentEngine] Groq fallback failed, using rule-based classification:', err);
      }
    }

    const prediction: SentimentPrediction = {
      id: predictionId,
      userId,
      primary_emotion: primaryEmotion,
      secondary_emotions: secondaryEmotions.filter((e) => e !== primaryEmotion).slice(0, 3),
      sentiment_polarity: polarity,
      confidence: Number(confidence.toFixed(2)),
      uncertainty,
      evidence,
      context_used: contextUsed,
      speech_prosody_used: speechProsodyUsed,
      language_detected: language,
      model_version: SENTIMENT_MODEL_VERSION,
      timestamp,
      raw_input: trimmed,
    };

    this.persistPrediction(prediction, userId);
    return prediction;
  }

  private persistPrediction(prediction: SentimentPrediction, userId: string): void {
    this.lastPredictions.set(userId, prediction);
    feedbackStore.savePrediction(prediction);
    contextTracker.addInteraction(userId, 'user', prediction.raw_input || '', prediction);
  }

  public getRecentPrediction(userId: string = 'default_user'): SentimentPrediction | null {
    if (this.lastPredictions.has(userId)) {
      return this.lastPredictions.get(userId)!;
    }
    const history = feedbackStore.getPredictions(userId);
    if (history.length > 0) {
      this.lastPredictions.set(userId, history[0]);
      return history[0];
    }
    return null;
  }

  public getRecentSentiment(userId: string = 'default_user'): SentimentCategory {
    const recent = this.getRecentPrediction(userId);
    return recent?.primary_emotion || 'neutral';
  }

  private async queryGroqSentiment(
    text: string, 
    apiKey: string, 
    model: string = 'qwen/qwen3.8-27b'
  ): Promise<Partial<SentimentPrediction> | null> {
    const systemPrompt = `You are an expert multilingual sentiment analysis engine specialized in English, Tamil script, and Tanglish.
Analyze the user message and return ONLY a valid JSON object matching this schema:
{
  "primary_emotion": "happy"|"sad"|"angry"|"frustrated"|"neutral"|"excited"|"confused"|"anxious"|"calm"|"disappointed"|"motivated"|"tired"|"stressed"|"curious"|"mixed"|"ambiguous"|"insufficient_evidence",
  "secondary_emotions": ["emotion1", "emotion2"],
  "sentiment_polarity": "positive"|"negative"|"neutral"|"mixed",
  "confidence": 0.0 to 1.0,
  "uncertainty": "low"|"moderate"|"high",
  "evidence": ["evidence point 1", "evidence point 2"]
}
Do not include any other markdown or text outside the JSON block.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq HTTP ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

export const sentimentEngine = new SentimentEngine();
