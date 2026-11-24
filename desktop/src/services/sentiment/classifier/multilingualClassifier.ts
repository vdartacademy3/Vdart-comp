import { PreprocessedText } from '../preprocessing/normalizer';
import { SentimentCategory, SentimentPolarity, UncertaintyLevel } from '../types';

export interface ClassifierResult {
  primary_emotion: SentimentCategory;
  secondary_emotions: SentimentCategory[];
  sentiment_polarity: SentimentPolarity;
  confidence: number;
  uncertainty: UncertaintyLevel;
  evidence: string[];
  score_breakdown: Partial<Record<SentimentCategory, number>>;
}

interface EmotionRule {
  category: SentimentCategory;
  polarity: SentimentPolarity;
  en_terms: string[];
  ta_terms: string[];
  tanglish_terms: string[];
  emojis: string[];
  weight: number;
}

const EMOTION_RULES: EmotionRule[] = [
  {
    category: 'happy',
    polarity: 'positive',
    en_terms: ['happy', 'glad', 'great', 'delighted', 'pleased', 'good', 'joy', 'joyful', 'content', 'satisfaction'],
    ta_terms: ['மகிழ்ச்சி', 'நன்றி', 'நலம்', 'இன்பம்'],
    tanglish_terms: ['sandhosham', 'magizhchi', 'romba nandri', 'nandri', 'santhosham', 'super ah irukku', 'nalla irukku'],
    emojis: ['😊', '😃', '😄', '😁', '❤️', '👍', '🙌'],
    weight: 1.0,
  },
  {
    category: 'excited',
    polarity: 'positive',
    en_terms: ['excited', 'thrilled', 'hyped', 'amazing', 'awesome', 'superb', 'mindblowing', 'cannot wait', "can't wait", 'celebrate'],
    ta_terms: ['அற்புதம்', 'வெற்றி', 'கொண்டாட்டம்'],
    tanglish_terms: ['verithanam', 'mass', 'attagasam', 'therikka', 'vera level', 'semma mass', 'pinnitan'],
    emojis: ['🔥', '🚀', '🤩', '💃', '🕺', '🥳', '🎉', '✨'],
    weight: 1.2,
  },
  {
    category: 'motivated',
    polarity: 'positive',
    en_terms: ['motivated', 'inspired', 'focused', 'determined', 'driven', 'crushing it', 'productive', 'achieve', 'momentum', 'let us do this'],
    ta_terms: ['ஊக்கம்', 'முயற்சி', 'வெற்றி'],
    tanglish_terms: ['full energy', 'seivom', 'vetri nichayam', 'semma momentum', 'mudichu kaatuvom', 'energy'],
    emojis: ['🎯', '💪', '🏆', '⚡', '📈'],
    weight: 1.1,
  },
  {
    category: 'calm',
    polarity: 'positive',
    en_terms: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'smooth', 'stable', 'at ease', 'comfortable'],
    ta_terms: ['அமைதி', 'நிம்மதி'],
    tanglish_terms: ['nimmathi', 'amaithi', 'chill', 'peaceful ah irukku', 'relaxed ah iruken'],
    emojis: ['😌', '🧘', '☕', '🍃'],
    weight: 0.95,
  },
  {
    category: 'curious',
    polarity: 'neutral',
    en_terms: ['curious', 'wondering', 'interested', 'explore', 'fascinated', 'intrigued', 'want to know', 'how does this work'],
    ta_terms: ['ஆர்வமாக', 'ஆச்சரியம்'],
    tanglish_terms: ['aarvam', 'therinjikka aasai', 'interseting ah irukku', 'epdi work aagudhu'],
    emojis: ['🧐', '🔍', '💡', '👁️'],
    weight: 1.0,
  },
  {
    category: 'sad',
    polarity: 'negative',
    en_terms: ['sad', 'unhappy', 'depressed', 'down', 'heartbroken', 'crying', 'hopeless', 'grief', 'miserable', 'lonely', 'sorrow'],
    ta_terms: ['வருத்தம்', 'கவலை', 'துக்கம்', 'அழுகை'],
    tanglish_terms: ['varutham', 'kavalai', 'sogam', 'azhugai', 'valikudhu', 'romba kashtama irukku', 'mood off'],
    emojis: ['😢', '😭', '😞', '😔', '💔', '😿'],
    weight: 1.1,
  },
  {
    category: 'angry',
    polarity: 'negative',
    en_terms: ['angry', 'furious', 'mad', 'pissed', 'hate', 'outraged', 'disgusted', 'wrath', 'enraged'],
    ta_terms: ['கோபம்', 'ஆத்திரம்', 'வெறுப்பு'],
    tanglish_terms: ['kovam', 'erichal', 'kadupu', 'veruppu', 'aathiram', 'bayangara kovam'],
    emojis: ['😡', '😠', '🤬', '👿'],
    weight: 1.25,
  },
  {
    category: 'frustrated',
    polarity: 'negative',
    en_terms: ['frustrated', 'annoyed', 'irritated', 'stuck', 'fed up', 'tired of this', 'not working', 'broken', 'buggy', 'blocker', 'failing'],
    ta_terms: ['சலிப்பு', 'தோல்வி', 'சிக்கல்'],
    tanglish_terms: ['mudiyala', 'sodhappal', 'tension', 'problem', 'crash aagudhu', 'work aagala', 'stuck aayiten', 'kaduppa irukku'],
    emojis: ['😤', '😫', '😩', '🤦', '😣'],
    weight: 1.15,
  },
  {
    category: 'anxious',
    polarity: 'negative',
    en_terms: ['anxious', 'worried', 'nervous', 'scared', 'fearful', 'panicking', 'dread', 'tense', 'insecure', 'apprehensive'],
    ta_terms: ['பயம்', 'படபடப்பு', 'பயமாக'],
    tanglish_terms: ['bayama irukku', 'tension ah irukku', 'padapadappu', 'nervous ah iruken', ' பயம்'],
    emojis: ['😰', '😨', '🫨', '😬', '😟'],
    weight: 1.1,
  },
  {
    category: 'stressed',
    polarity: 'negative',
    en_terms: ['stressed', 'stress', 'pressure', 'deadline', 'overwhelmed', 'burnout', 'too much work', 'hectic', 'overloaded'],
    ta_terms: ['மன அழுத்தம்', 'அழுத்தம்'],
    tanglish_terms: ['romba pressure', 'work overload', 'stress ah irukku', 'deadline mudiyala', 'overwhelmed'],
    emojis: ['🤯', '📉', '🥵', '😵'],
    weight: 1.15,
  },
  {
    category: 'disappointed',
    polarity: 'negative',
    en_terms: ['disappointed', 'disappointing', 'let down', 'disillusioned', 'regret', 'unfortunate', 'failed expectation', 'expected better'],
    ta_terms: ['ஏமாற்றம்', 'தோல்வி'],
    tanglish_terms: ['yematram', 'disappointed', 'disappointing', 'disappointed ah irukku', 'edhir paakala', 'waste aayiruchu'],
    emojis: ['😞', '😒', '👎', '😕'],
    weight: 1.05,
  },
  {
    category: 'tired',
    polarity: 'negative',
    en_terms: ['tired', 'sleepy', 'drowsy', 'exhausted', 'low energy', 'fatigued', 'need rest', 'drained', 'worn out'],
    ta_terms: ['சோர்வு', 'தூக்கம்', 'களைப்பு'],
    tanglish_terms: ['thookam varudhu', 'tired ah irukku', 'kalaippa irukku', 'rest theva', 'energy illa'],
    emojis: ['🥱', '😴', '💤', '🛌'],
    weight: 1.0,
  },
  {
    category: 'confused',
    polarity: 'neutral',
    en_terms: ['confused', 'puzzled', 'unsure', 'what do you mean', 'how does this', 'why is this', 'lost', 'perplexed', 'clarification'],
    ta_terms: ['குழப்பம்', 'புரியவில்லை'],
    tanglish_terms: ['puriyala', 'puriyavillai', 'kuzhappam', 'therila', 'enna solreenga', 'clarity illa'],
    emojis: ['🤔', '🤨', '🧐', '❓', '❔'],
    weight: 1.0,
  },
];

export class MultilingualSentimentClassifier {
  private version = 'vcamp-sent-v2.5-hybrid';

  public getModelVersion(): string {
    return this.version;
  }

  public classify(prep: PreprocessedText): ClassifierResult {
    const text = prep.normalized;
    const tokens = prep.tokens;
    const evidence: string[] = [];

    // Empty or greeting-only input
    if (tokens.length === 0) {
      return {
        primary_emotion: 'insufficient_evidence',
        secondary_emotions: [],
        sentiment_polarity: 'neutral',
        confidence: 0.5,
        uncertainty: 'high',
        evidence: ['Input contains insufficient tokens for emotional analysis'],
        score_breakdown: {},
      };
    }

    // Check for explicit Ambiguous / Sarcasm statements
    if (prep.sarcasmLikely) {
      evidence.push('Detected linguistic sarcasm marker with negative operational context');
      return {
        primary_emotion: 'frustrated',
        secondary_emotions: ['disappointed'],
        sentiment_polarity: 'negative',
        confidence: 0.82,
        uncertainty: 'low',
        evidence,
        score_breakdown: { frustrated: 2.5, disappointed: 1.2 },
      };
    }

    // Check for explicit "mixed" phrases
    const mixedPhrases = [
      /\b(happy.*(but|still).*(stress|tired|worried))\b/i,
      /\b(okay.*(but|however).*(stress|problem|issue))\b/i,
      /\b(mixed feelings|bittersweet|conflicted)\b/i,
      /\b(sandhoshama.*irukku.*aana.*bayama)\b/i
    ];
    for (const pat of mixedPhrases) {
      if (pat.test(text)) {
        evidence.push('Sentence exhibits contradictory polarity clauses with contrastive conjunction ("but/still/aana")');
        return {
          primary_emotion: 'mixed',
          secondary_emotions: ['stressed', 'happy'],
          sentiment_polarity: 'mixed',
          confidence: 0.85,
          uncertainty: 'low',
          evidence,
          score_breakdown: { mixed: 3.0, stressed: 1.8, happy: 1.5 },
        };
      }
    }

    // Negation specials:
    // e.g. "not happy" -> sad/frustrated
    // e.g. "nothing is wrong" -> calm/neutral
    // e.g. "not bad" -> calm/happy
    if (/\b(nothing\s+is\s+wrong|no\s+problem|no\s+issues|nothing\s+bad)\b/i.test(text)) {
      evidence.push('Detected negated negative phrase expressing baseline stability ("nothing is wrong")');
      return {
        primary_emotion: 'calm',
        secondary_emotions: ['neutral'],
        sentiment_polarity: 'positive',
        confidence: 0.88,
        uncertainty: 'low',
        evidence,
        score_breakdown: { calm: 2.0, neutral: 1.0 },
      };
    }

    if (/\b(not\s+bad|not\s+terrible)\b/i.test(text)) {
      evidence.push('Detected understatement negation ("not bad") indicating mild positive/calm sentiment');
      return {
        primary_emotion: 'calm',
        secondary_emotions: ['happy'],
        sentiment_polarity: 'positive',
        confidence: 0.80,
        uncertainty: 'moderate',
        evidence,
        score_breakdown: { calm: 1.5, happy: 1.0 },
      };
    }

    if (/\b(not\s+happy|happy\s*illa|sandhosham\s*illa)\b/i.test(text)) {
      evidence.push('Direct negation of positive emotion ("not happy / happy illa") indicating frustration or sadness');
      return {
        primary_emotion: 'sad',
        secondary_emotions: ['frustrated'],
        sentiment_polarity: 'negative',
        confidence: 0.86,
        uncertainty: 'low',
        evidence,
        score_breakdown: { sad: 2.2, frustrated: 1.8 },
      };
    }

    // Score accumulation across rules
    const scores: Partial<Record<SentimentCategory, number>> = {};
    const matchedCategories = new Set<SentimentCategory>();

    for (const rule of EMOTION_RULES) {
      let ruleScore = 0;

      // English terms matching
      for (const term of rule.en_terms) {
        const regex = new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (regex.test(text)) {
          // Check if term is negated
          const isNeg = prep.hasNegation && prep.negatedTerms.some(nt => term.includes(nt));
          if (!isNeg) {
            ruleScore += rule.weight;
            evidence.push(`Matched English keyword: "${term}"`);
          }
        }
      }

      // Tamil script terms matching
      for (const term of rule.ta_terms) {
        if (text.includes(term)) {
          ruleScore += rule.weight * 1.25; // boost Tamil script accuracy
          evidence.push(`Matched Tamil script term: "${term}"`);
        }
      }

      // Tanglish transliterations matching
      for (const term of rule.tanglish_terms) {
        const regex = new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (regex.test(text)) {
          const isNeg = prep.hasNegation && prep.negatedTerms.some(nt => term.includes(nt));
          if (!isNeg) {
            ruleScore += rule.weight * 1.2;
            evidence.push(`Matched Tanglish lexical marker: "${term}"`);
          }
        }
      }

      // Emojis
      for (const em of rule.emojis) {
        if (prep.emojis.includes(em)) {
          ruleScore += 0.9;
          evidence.push(`Matched emotional emoji: "${em}"`);
        }
      }

      if (ruleScore > 0) {
        scores[rule.category] = ruleScore;
        matchedCategories.add(rule.category);
      }
    }

    // Contrastive conjunctions & mixed sentiment detection
    const hasContrastiveConjunction = /\b(but|however|although|yet|though|aana|aanal)\b/i.test(text) || /[\u0B86][\u0BA9][\u0BBE][\u0BB2][\u0BCD]/.test(text); // ஆனால்
    if (hasContrastiveConjunction && matchedCategories.size >= 2) {
      const cats = Array.from(matchedCategories);
      const hasPos = cats.some((c) => EMOTION_RULES.find((r) => r.category === c)?.polarity === 'positive');
      const hasNeg = cats.some((c) => EMOTION_RULES.find((r) => r.category === c)?.polarity === 'negative');
      if (hasPos && hasNeg) {
        return {
          primary_emotion: 'mixed',
          secondary_emotions: cats.slice(0, 3),
          sentiment_polarity: 'mixed',
          confidence: 0.85,
          uncertainty: 'moderate',
          evidence: ['Contrastive conjunction detected with conflicting positive and negative emotional states'],
          score_breakdown: scores,
        };
      }
    }

    // Check for ambiguous / uncommitted expressions
    const isAmbiguous = /\b(whatever|who knows|dont know|don't know|dunno|maybe|paakalaam|paarkalaam|enna aagudho|vidu)\b/i.test(text);
    if (isAmbiguous && matchedCategories.size === 0) {
      return {
        primary_emotion: 'ambiguous',
        secondary_emotions: ['neutral'],
        sentiment_polarity: 'neutral',
        confidence: 0.72,
        uncertainty: 'high',
        evidence: ['Ambiguous or uncommitted attitude detected ("whatever/paakalaam vidu")'],
        score_breakdown: { ambiguous: 1.0 },
      };
    }

    // If no strong emotional keywords were found
    if (matchedCategories.size === 0) {
      // Check for neutral statements
      if (/\b(ok|okay|fine|alright|normal|saridhan|sari|working on|doing|testing)\b/i.test(text)) {
        return {
          primary_emotion: 'neutral',
          secondary_emotions: ['calm'],
          sentiment_polarity: 'neutral',
          confidence: 0.85,
          uncertainty: 'low',
          evidence: ['Utterance conveys everyday factual/neutral task status'],
          score_breakdown: { neutral: 1.0 },
        };
      }

      return {
        primary_emotion: 'neutral',
        secondary_emotions: [],
        sentiment_polarity: 'neutral',
        confidence: 0.72,
        uncertainty: 'moderate',
        evidence: ['No pronounced emotional valence markers detected; defaulting to neutral baseline'],
        score_breakdown: { neutral: 0.5 },
      };
    }

    // Rank scored categories
    const sortedCategories = Array.from(matchedCategories).sort((a, b) => (scores[b] || 0) - (scores[a] || 0));

    const primary = sortedCategories[0];
    const topScore = scores[primary] || 1;
    const secondaryList = sortedCategories.slice(1, 3);

    // Margin analysis for uncertainty calibration
    const runnerUpScore = secondaryList.length > 0 ? (scores[secondaryList[0]] || 0) : 0;
    const margin = topScore - runnerUpScore;

    let confidence = Math.min(0.70 + (topScore * 0.1), 0.96);
    let uncertainty: UncertaintyLevel = 'low';

    if (margin < 0.25 && secondaryList.length > 0) {
      uncertainty = 'moderate';
      confidence = Math.max(0.64, confidence - 0.12);
    }
    if (confidence < 0.68) {
      uncertainty = 'high';
    }

    // Determine Polarity
    const primaryRule = EMOTION_RULES.find(r => r.category === primary);
    let polarity: SentimentPolarity = primaryRule?.polarity || 'neutral';
    if (secondaryList.length > 0) {
      const secondaryRule = EMOTION_RULES.find(r => r.category === secondaryList[0]);
      if (secondaryRule && secondaryRule.polarity !== polarity && polarity !== 'neutral') {
        polarity = 'mixed';
      }
    }

    return {
      primary_emotion: primary,
      secondary_emotions: secondaryList,
      sentiment_polarity: polarity,
      confidence: Number(confidence.toFixed(2)),
      uncertainty,
      evidence: evidence.slice(0, 4),
      score_breakdown: scores,
    };
  }
}

export const multilingualClassifier = new MultilingualSentimentClassifier();

export const classifySentiment = (preprocessed: PreprocessedText): ClassifierResult => {
  return multilingualClassifier.classify(preprocessed);
};

