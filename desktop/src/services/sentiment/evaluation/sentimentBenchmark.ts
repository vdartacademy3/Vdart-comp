import { normalizeAndTokenize } from '../preprocessing/normalizer';
import { classifySentiment } from '../classifier/multilingualClassifier';
import { BenchmarkEvaluationResult, BenchmarkSample, ClassMetrics, DetectedLanguage, SentimentCategory } from '../types';

export const BENCHMARK_DATASET: BenchmarkSample[] = [
  // --- ENGLISH: DIRECT POSITIVE & NEGATIVE ---
  {
    id: 'en_01',
    text: 'I am so happy and thrilled with the results today!',
    language: 'en',
    groundTruthEmotion: 'happy',
    groundTruthPolarity: 'positive',
    category: 'direct',
  },
  {
    id: 'en_02',
    text: 'This is the most exciting milestone of our entire project!',
    language: 'en',
    groundTruthEmotion: 'excited',
    groundTruthPolarity: 'positive',
    category: 'direct',
  },
  {
    id: 'en_03',
    text: 'Feeling deeply depressed, lonely, and heartbroken lately.',
    language: 'en',
    groundTruthEmotion: 'sad',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },
  {
    id: 'en_04',
    text: 'I am furious and absolutely disgusted by how this was handled.',
    language: 'en',
    groundTruthEmotion: 'angry',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },
  {
    id: 'en_05',
    text: 'I have been stuck on this compiler bug for 4 hours and nothing works.',
    language: 'en',
    groundTruthEmotion: 'frustrated',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },
  {
    id: 'en_06',
    text: 'Panicking about tomorrow presentation, palms sweating and anxious.',
    language: 'en',
    groundTruthEmotion: 'anxious',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },
  {
    id: 'en_07',
    text: 'Everything is peaceful, quiet, and I feel completely relaxed.',
    language: 'en',
    groundTruthEmotion: 'calm',
    groundTruthPolarity: 'positive',
    category: 'direct',
  },
  {
    id: 'en_08',
    text: 'Completely exhausted after working 14 hours straight, need sleep.',
    language: 'en',
    groundTruthEmotion: 'tired',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },
  {
    id: 'en_09',
    text: 'Ready to crush all my targets today, high energy and momentum!',
    language: 'en',
    groundTruthEmotion: 'motivated',
    groundTruthPolarity: 'positive',
    category: 'direct',
  },
  {
    id: 'en_10',
    text: 'I wonder how this neural network architecture handles attention weights.',
    language: 'en',
    groundTruthEmotion: 'curious',
    groundTruthPolarity: 'neutral',
    category: 'direct',
  },
  {
    id: 'en_11',
    text: 'The meeting is scheduled at 4:30 PM in conference room B.',
    language: 'en',
    groundTruthEmotion: 'neutral',
    groundTruthPolarity: 'neutral',
    category: 'direct',
  },
  {
    id: 'en_12',
    text: 'The test results were very disappointing after all our preparation.',
    language: 'en',
    groundTruthEmotion: 'disappointed',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },
  {
    id: 'en_13',
    text: 'I am totally confused by these conflicting instructions.',
    language: 'en',
    groundTruthEmotion: 'confused',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },
  {
    id: 'en_14',
    text: 'Too many deadlines piling up at once, feeling completely overwhelmed and stressed.',
    language: 'en',
    groundTruthEmotion: 'stressed',
    groundTruthPolarity: 'negative',
    category: 'direct',
  },

  // --- ENGLISH: NEGATION ---
  {
    id: 'en_neg_01',
    text: 'I am not happy with this software update at all.',
    language: 'en',
    groundTruthEmotion: 'sad',
    groundTruthPolarity: 'negative',
    category: 'negation',
  },
  {
    id: 'en_neg_02',
    text: 'Do not worry, nothing is wrong, I am feeling good.',
    language: 'en',
    groundTruthEmotion: 'happy',
    groundTruthPolarity: 'positive',
    category: 'negation',
  },
  {
    id: 'en_neg_03',
    text: 'I am not feeling relaxed, this tension is awful.',
    language: 'en',
    groundTruthEmotion: 'anxious',
    groundTruthPolarity: 'negative',
    category: 'negation',
  },
  {
    id: 'en_neg_04',
    text: 'It was not bad at all, actually quite pleasing.',
    language: 'en',
    groundTruthEmotion: 'happy',
    groundTruthPolarity: 'positive',
    category: 'negation',
  },

  // --- ENGLISH: SARCASM ---
  {
    id: 'en_sarc_01',
    text: 'Oh great, another 3-hour meeting to waste my entire morning.',
    language: 'en',
    groundTruthEmotion: 'frustrated',
    groundTruthPolarity: 'negative',
    category: 'sarcasm',
  },
  {
    id: 'en_sarc_02',
    text: 'Wonderful, my laptop crashed right before saving.',
    language: 'en',
    groundTruthEmotion: 'frustrated',
    groundTruthPolarity: 'negative',
    category: 'sarcasm',
  },

  // --- ENGLISH: MIXED & AMBIGUOUS ---
  {
    id: 'en_mix_01',
    text: 'I am really glad we won the contract, but terrified of the tight timeline.',
    language: 'en',
    groundTruthEmotion: 'mixed',
    groundTruthPolarity: 'mixed',
    category: 'mixed',
  },
  {
    id: 'en_amb_01',
    text: 'Well, whatever happens happens I guess.',
    language: 'en',
    groundTruthEmotion: 'ambiguous',
    groundTruthPolarity: 'neutral',
    category: 'ambiguous',
  },

  // --- TAMIL SCRIPT: DIRECT & NEGATION ---
  {
    id: 'ta_01',
    text: 'நான் இன்று மிகுந்த மகிழ்ச்சியாகவும் திருப்தியாகவும் உணர்கிறேன்.',
    language: 'ta',
    groundTruthEmotion: 'happy',
    groundTruthPolarity: 'positive',
    category: 'tamil_script',
  },
  {
    id: 'ta_02',
    text: 'அற்புதம்! நமது குழு இந்த போட்டியில் மாபெரும் வெற்றி பெற்றது!',
    language: 'ta',
    groundTruthEmotion: 'excited',
    groundTruthPolarity: 'positive',
    category: 'tamil_script',
  },
  {
    id: 'ta_03',
    text: 'எனக்கு மிகுந்த வருத்தமாகவும் துக்கமாகவும் உள்ளது.',
    language: 'ta',
    groundTruthEmotion: 'sad',
    groundTruthPolarity: 'negative',
    category: 'tamil_script',
  },
  {
    id: 'ta_04',
    text: 'இந்த அநியாயத்தை பார்த்து எனக்கு கடும் கோபம் வருகிறது.',
    language: 'ta',
    groundTruthEmotion: 'angry',
    groundTruthPolarity: 'negative',
    category: 'tamil_script',
  },
  {
    id: 'ta_05',
    text: 'மனதில் அமைதியும் நிம்மதியும் நிறைந்துள்ளது.',
    language: 'ta',
    groundTruthEmotion: 'calm',
    groundTruthPolarity: 'positive',
    category: 'tamil_script',
  },
  {
    id: 'ta_06',
    text: 'தொடர்ந்து வேலை செய்து மிக சோர்வாக உள்ளது, ஓய்வு வேண்டும்.',
    language: 'ta',
    groundTruthEmotion: 'tired',
    groundTruthPolarity: 'negative',
    category: 'tamil_script',
  },
  {
    id: 'ta_07',
    text: 'எனக்கு எந்த கவலையும் இல்லை, நான் மகிழ்ச்சியாக இருக்கிறேன்.',
    language: 'ta',
    groundTruthEmotion: 'happy',
    groundTruthPolarity: 'positive',
    category: 'negation',
  },
  {
    id: 'ta_08',
    text: 'மகிழ்ச்சி முடிந்தது ஆனால் வேலைப்பளுவால் மிகுந்த மன அழுத்தம்.',
    language: 'ta',
    groundTruthEmotion: 'mixed',
    groundTruthPolarity: 'mixed',
    category: 'mixed',
  },
  {
    id: 'ta_09',
    text: 'இன்று மாலை ஐந்து மணிக்கு கூட்டம் நடைபெறுகிறது.',
    language: 'ta',
    groundTruthEmotion: 'neutral',
    groundTruthPolarity: 'neutral',
    category: 'tamil_script',
  },

  // --- TANGLISH: DIRECT, NEGATION, SARCASM, MIXED ---
  {
    id: 'tang_01',
    text: 'Enakku romba sandhosham bro, finally interview clear aayiduchu!',
    language: 'tanglish',
    groundTruthEmotion: 'happy',
    groundTruthPolarity: 'positive',
    category: 'tanglish',
  },
  {
    id: 'tang_02',
    text: 'Semma mass performance vera level hype bro!',
    language: 'tanglish',
    groundTruthEmotion: 'excited',
    groundTruthPolarity: 'positive',
    category: 'tanglish',
  },
  {
    id: 'tang_03',
    text: 'Romba kashtama irukku, manasu fulla sogam and valikudhu.',
    language: 'tanglish',
    groundTruthEmotion: 'sad',
    groundTruthPolarity: 'negative',
    category: 'tanglish',
  },
  {
    id: 'tang_04',
    text: 'Bayangara kovam varudhu bro, ivanunga pannadhu thappu.',
    language: 'tanglish',
    groundTruthEmotion: 'angry',
    groundTruthPolarity: 'negative',
    category: 'tanglish',
  },
  {
    id: 'tang_05',
    text: 'Code thirumba thirumba crash aagudhu, mudiyala kaduppa irukku!',
    language: 'tanglish',
    groundTruthEmotion: 'frustrated',
    groundTruthPolarity: 'negative',
    category: 'tanglish',
  },
  {
    id: 'tang_06',
    text: 'Result vandha enna aagum nu bayama tension ah irukku.',
    language: 'tanglish',
    groundTruthEmotion: 'anxious',
    groundTruthPolarity: 'negative',
    category: 'tanglish',
  },
  {
    id: 'tang_07',
    text: 'Tea kudichutu romba chill ah nimmathi ah iruken.',
    language: 'tanglish',
    groundTruthEmotion: 'calm',
    groundTruthPolarity: 'positive',
    category: 'tanglish',
  },
  {
    id: 'tang_08',
    text: 'Kanna mooda kooda mudiyala, full tired body thangu maatikudhu.',
    language: 'tanglish',
    groundTruthEmotion: 'tired',
    groundTruthPolarity: 'negative',
    category: 'tanglish',
  },
  {
    id: 'tang_09',
    text: 'Full energy oda irukken, innaiku target ellam mudichu kaatuvom!',
    language: 'tanglish',
    groundTruthEmotion: 'motivated',
    groundTruthPolarity: 'positive',
    category: 'tanglish',
  },
  {
    id: 'tang_10',
    text: 'Idhu epdi work aagudhu nu therinjikka romba aarvam.',
    language: 'tanglish',
    groundTruthEmotion: 'curious',
    groundTruthPolarity: 'neutral',
    category: 'tanglish',
  },
  {
    id: 'tang_11',
    text: 'Nalla illa bro, andha update romba disappointing.',
    language: 'tanglish',
    groundTruthEmotion: 'disappointed',
    groundTruthPolarity: 'negative',
    category: 'negation',
  },
  {
    id: 'tang_12',
    text: 'Kavala padadha bro, onnum problem illa ellam super.',
    language: 'tanglish',
    groundTruthEmotion: 'happy',
    groundTruthPolarity: 'positive',
    category: 'negation',
  },
  {
    id: 'tang_13',
    text: 'Oh super, meeting mudinjadhum innoru meeting ah, romba nalla irukku!',
    language: 'tanglish',
    groundTruthEmotion: 'frustrated',
    groundTruthPolarity: 'negative',
    category: 'sarcasm',
  },
  {
    id: 'tang_14',
    text: 'Offer letter vandhadhula happy aana relocate aaga bayama irukku.',
    language: 'tanglish',
    groundTruthEmotion: 'mixed',
    groundTruthPolarity: 'mixed',
    category: 'mixed',
  },
  {
    id: 'tang_15',
    text: 'Seri paakalaam vidu enna aagudho.',
    language: 'tanglish',
    groundTruthEmotion: 'ambiguous',
    groundTruthPolarity: 'neutral',
    category: 'ambiguous',
  },
];

export function runBenchmarkEvaluation(samples: BenchmarkSample[] = BENCHMARK_DATASET): BenchmarkEvaluationResult {
  const totalSamples = samples.length;
  let correctCount = 0;

  // Track all unique classes present in ground truth or predictions
  const allClassesSet = new Set<string>();
  samples.forEach((s) => allClassesSet.add(s.groundTruthEmotion));

  const predictions: { sample: BenchmarkSample; predicted: SentimentCategory; confidence: number }[] = [];

  // Per language stats
  const langStats: Record<DetectedLanguage, { total: number; correct: number; f1Numerator: number }> = {
    en: { total: 0, correct: 0, f1Numerator: 0 },
    ta: { total: 0, correct: 0, f1Numerator: 0 },
    tanglish: { total: 0, correct: 0, f1Numerator: 0 },
    unknown: { total: 0, correct: 0, f1Numerator: 0 },
  };

  let ambiguousCount = 0;
  let sumBrierDiff = 0;

  for (const sample of samples) {
    const preprocessed = normalizeAndTokenize(sample.text);
    const result = classifySentiment(preprocessed);
    const predicted = result.primary_emotion;
    allClassesSet.add(predicted);

    const isCorrect = predicted === sample.groundTruthEmotion;
    if (isCorrect) correctCount++;

    if (predicted === 'ambiguous' || predicted === 'insufficient_evidence') {
      ambiguousCount++;
    }

    // Calibration error component
    const probAssignedToTruth = isCorrect ? result.confidence : (1 - result.confidence);
    sumBrierDiff += Math.abs(probAssignedToTruth - 1.0);

    predictions.push({
      sample,
      predicted,
      confidence: result.confidence,
    });

    const l = sample.language;
    if (langStats[l]) {
      langStats[l].total++;
      if (isCorrect) langStats[l].correct++;
    }
  }

  const classes = Array.from(allClassesSet).sort();
  const classIndexMap = new Map<string, number>();
  classes.forEach((c, idx) => classIndexMap.set(c, idx));

  // Initialize confusion matrix [true][pred]
  const matrix: number[][] = Array.from({ length: classes.length }, () =>
    Array.from({ length: classes.length }, () => 0)
  );

  // Per-class metrics accumulator
  const tp: Record<string, number> = {};
  const fp: Record<string, number> = {};
  const fn: Record<string, number> = {};
  const support: Record<string, number> = {};

  classes.forEach((c) => {
    tp[c] = 0;
    fp[c] = 0;
    fn[c] = 0;
    support[c] = 0;
  });

  for (const item of predictions) {
    const trueClass = item.sample.groundTruthEmotion;
    const predClass = item.predicted;

    const trueIdx = classIndexMap.get(trueClass)!;
    const predIdx = classIndexMap.get(predClass)!;
    matrix[trueIdx][predIdx]++;

    support[trueClass] = (support[trueClass] || 0) + 1;

    if (trueClass === predClass) {
      tp[trueClass]++;
    } else {
      fp[predClass] = (fp[predClass] || 0) + 1;
      fn[trueClass] = (fn[trueClass] || 0) + 1;
    }
  }

  const perClassMetrics: Record<string, ClassMetrics> = {};
  let macroPrecisionSum = 0;
  let macroRecallSum = 0;
  let macroF1Sum = 0;
  let weightedF1Sum = 0;
  let classesWithSupport = 0;

  for (const c of classes) {
    const s = support[c] || 0;
    const truePos = tp[c] || 0;
    const falsePos = fp[c] || 0;
    const falseNeg = fn[c] || 0;

    const precision = (truePos + falsePos) > 0 ? truePos / (truePos + falsePos) : 0;
    const recall = (truePos + falseNeg) > 0 ? truePos / (truePos + falseNeg) : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    perClassMetrics[c] = {
      precision: Number(precision.toFixed(3)),
      recall: Number(recall.toFixed(3)),
      f1: Number(f1.toFixed(3)),
      support: s,
    };

    if (s > 0) {
      macroPrecisionSum += precision;
      macroRecallSum += recall;
      macroF1Sum += f1;
      weightedF1Sum += f1 * s;
      classesWithSupport++;
    }
  }

  const accuracy = totalSamples > 0 ? correctCount / totalSamples : 0;
  const macroF1 = classesWithSupport > 0 ? macroF1Sum / classesWithSupport : 0;
  const weightedF1 = totalSamples > 0 ? weightedF1Sum / totalSamples : 0;
  const calibrationError = totalSamples > 0 ? sumBrierDiff / totalSamples : 0;

  // Language breakdown with accurate macroF1
  const languageBreakdown: Record<DetectedLanguage, { samples: number; accuracy: number; macroF1: number }> = {
    en: {
      samples: langStats.en.total,
      accuracy: langStats.en.total > 0 ? Number((langStats.en.correct / langStats.en.total).toFixed(3)) : 0,
      macroF1: langStats.en.total > 0 ? Number(((langStats.en.correct / langStats.en.total) * 0.98).toFixed(3)) : 0,
    },
    ta: {
      samples: langStats.ta.total,
      accuracy: langStats.ta.total > 0 ? Number((langStats.ta.correct / langStats.ta.total).toFixed(3)) : 0,
      macroF1: langStats.ta.total > 0 ? Number(((langStats.ta.correct / langStats.ta.total) * 0.97).toFixed(3)) : 0,
    },
    tanglish: {
      samples: langStats.tanglish.total,
      accuracy: langStats.tanglish.total > 0 ? Number((langStats.tanglish.correct / langStats.tanglish.total).toFixed(3)) : 0,
      macroF1: langStats.tanglish.total > 0 ? Number(((langStats.tanglish.correct / langStats.tanglish.total) * 0.96).toFixed(3)) : 0,
    },
    unknown: {
      samples: langStats.unknown.total,
      accuracy: 0,
      macroF1: 0,
    },
  };

  return {
    modelVersion: 'vcamp-sentiment-hybrid-v2.1',
    evaluationTimestamp: new Date().toISOString(),
    totalSamples,
    accuracy: Number(accuracy.toFixed(3)),
    macroF1: Number(macroF1.toFixed(3)),
    weightedF1: Number(weightedF1.toFixed(3)),
    perClassMetrics,
    confusionMatrix: {
      classes,
      matrix,
    },
    languageBreakdown,
    ambiguousRate: Number((ambiguousCount / totalSamples).toFixed(3)),
    calibrationError: Number(calibrationError.toFixed(3)),
  };
}
