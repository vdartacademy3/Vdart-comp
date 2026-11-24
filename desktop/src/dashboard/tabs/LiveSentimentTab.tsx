import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Check, 
  HelpCircle, 
  Languages, 
  BrainCircuit, 
  Mic, 
  ArrowRight,
  ShieldAlert,
  Send,
  RotateCcw
} from 'lucide-react';
import { 
  sentimentEngine, 
  feedbackStore, 
  SentimentCategory, 
  SentimentPrediction,
  SentimentFeedbackItem,
  SENTIMENT_MODEL_VERSION 
} from '../../services/sentimentService';
import { useCompanionStore } from '../../stores/companionStore';

const ALL_EMOTIONS: SentimentCategory[] = [
  'happy', 'excited', 'motivated', 'calm', 'curious',
  'neutral', 'mixed', 'ambiguous', 'insufficient_evidence',
  'sad', 'frustrated', 'angry', 'anxious', 'stressed', 'tired', 'confused', 'disappointed'
];

const SAMPLE_PROMPTS = [
  { label: 'English Direct', text: 'I am so happy and thrilled with our breakthrough today!' },
  { label: 'English Negation', text: 'I am not happy with this software update at all.' },
  { label: 'English Sarcasm', text: 'Oh great, another 3-hour meeting to waste my entire morning.' },
  { label: 'English Mixed', text: 'Really happy we won the contract, but stressed about the workload.' },
  { label: 'Tamil Script', text: 'நான் இன்று மிகுந்த மகிழ்ச்சியாகவும் அமைதியாகவும் இருக்கிறேன்.' },
  { label: 'Tamil Negation', text: 'எனக்கு எந்த கவலையும் இல்லை, எல்லாம் நல்லபடியாக உள்ளது.' },
  { label: 'Tanglish Mass', text: 'Semma mass performance bro, vera level hype!' },
  { label: 'Tanglish Frustration', text: 'Code thirumba thirumba crash aagudhu, mudiyala kaduppa irukku.' },
];

export const LiveSentimentTab: React.FC = () => {
  const { groqApiKey, groqModel } = useCompanionStore();
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<SentimentPrediction | null>(
    () => sentimentEngine.getRecentPrediction('active_user')
  );
  const [selectedCorrection, setSelectedCorrection] = useState<SentimentCategory>('neutral');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<SentimentFeedbackItem[]>(
    () => feedbackStore.getFeedbackList('active_user')
  );

  const handleAnalyze = async (textToTest?: string) => {
    const text = (textToTest ?? inputText).trim();
    if (!text) return;
    setIsAnalyzing(true);
    setFeedbackSuccessMsg(null);

    try {
      const pred = await sentimentEngine.analyze(text, {
        userId: 'active_user',
        groqApiKey: groqApiKey || undefined,
        groqModel: groqModel || undefined,
        useGroqFallback: Boolean(groqApiKey),
      });
      setCurrentPrediction(pred);
      setSelectedCorrection(pred.primary_emotion);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmCorrect = () => {
    if (!currentPrediction) return;
    const item = feedbackStore.submitFeedback({
      predictionId: currentPrediction.id,
      userId: 'active_user',
      originalEmotion: currentPrediction.primary_emotion,
      correctedEmotion: currentPrediction.primary_emotion,
      feedbackType: 'confirmed_correct',
      notes: 'User verified as accurate',
      inputText: currentPrediction.raw_input || '',
      language: currentPrediction.language_detected,
    });
    setFeedbackHistory(feedbackStore.getFeedbackList('active_user'));
    setFeedbackSuccessMsg('Confirmed as accurate! Saved to labeled feedback store.');
  };

  const handleApplyCorrection = () => {
    if (!currentPrediction) return;
    const item = feedbackStore.submitFeedback({
      predictionId: currentPrediction.id,
      userId: 'active_user',
      originalEmotion: currentPrediction.primary_emotion,
      correctedEmotion: selectedCorrection,
      feedbackType: 'corrected',
      notes: correctionNotes || `User corrected from ${currentPrediction.primary_emotion} to ${selectedCorrection}`,
      inputText: currentPrediction.raw_input || '',
      language: currentPrediction.language_detected,
    });
    setFeedbackHistory(feedbackStore.getFeedbackList('active_user'));
    setFeedbackSuccessMsg(`Correction saved: "${currentPrediction.primary_emotion}" → "${selectedCorrection}". Original record preserved for evaluation.`);
    setCorrectionNotes('');
  };

  const uncertaintyColor = {
    low: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
    moderate: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
    high: 'text-rose-400 bg-rose-950/60 border-rose-500/30',
  }[currentPrediction?.uncertainty || 'low'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-cyan-400" />
          Live Sentiment Intelligence & Feedback Loop
        </h3>
        <p className="text-xs text-slate-400">
          Real-time multilingual sentiment reasoning engine across English, Tamil script, and Tanglish with zero-loss audit feedback.
        </p>
      </div>

      {/* Input / Playground */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <label className="text-xs font-semibold text-slate-300 block">
          Test Any Sentence Live (Tamil, English, or Tanglish)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Type a message (e.g., 'Semma mass bro', 'Not happy at all', 'ரொம்ப மகிழ்ச்சி')..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
          >
            {isAnalyzing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Analyze
          </button>
        </div>

        {/* Quick Sample Prompts */}
        <div className="pt-2">
          <span className="text-[11px] text-slate-400 mr-2">Try quick test cases:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {SAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(p.text);
                  handleAnalyze(p.text);
                }}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Prediction Card */}
      {currentPrediction ? (
        <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prediction Output</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {currentPrediction.model_version}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase ${uncertaintyColor}`}>
                Uncertainty: {currentPrediction.uncertainty}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date(currentPrediction.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Primary Emotion</span>
              <span className="text-xl font-bold text-white capitalize flex items-center gap-1.5">
                {currentPrediction.primary_emotion}
              </span>
              <span className="text-[11px] text-cyan-400 mt-1 block">
                Polarity: <span className="capitalize">{currentPrediction.sentiment_polarity}</span>
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Calibrated Confidence</span>
              <span className="text-2xl font-bold text-cyan-300">
                {(currentPrediction.confidence * 100).toFixed(0)}%
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, currentPrediction.confidence * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Detected Language</span>
              <span className="text-base font-semibold text-slate-200 capitalize flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-cyan-400" />
                {currentPrediction.language_detected === 'ta' ? 'Tamil (தமிழ்)' : currentPrediction.language_detected === 'tanglish' ? 'Tanglish (Romanized)' : 'English'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tokens: {currentPrediction.raw_input?.split(/\s+/).length || 0}
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Secondary Cues</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentPrediction.secondary_emotions.length > 0 ? (
                  currentPrediction.secondary_emotions.map((sec, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                      {sec}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500">None detected</span>
                )}
              </div>
            </div>
          </div>

          {/* Evidence and Reasoning */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Linguistic & Contextual Evidence</span>
            {currentPrediction.evidence.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                {currentPrediction.evidence.map((ev, idx) => (
                  <li key={idx} className="font-mono text-[11px] text-slate-300">{ev}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific linguistic triggers isolated.</p>
            )}
          </div>

          {/* User Feedback & Correction Controls */}
          <div className="p-3.5 bg-slate-900/90 rounded-lg border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Human-in-the-Loop Feedback & Calibration Loop
              </span>
              <span className="text-[10px] text-slate-400">Corrections are stored as labeled ground truth without overwriting history</span>
            </div>

            {feedbackSuccessMsg && (
              <div className="p-2 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{feedbackSuccessMsg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleConfirmCorrect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm Correct
              </button>

              <span className="text-xs text-slate-500">or correct prediction:</span>

              <select
                value={selectedCorrection}
                onChange={(e) => setSelectedCorrection(e.target.value as SentimentCategory)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 capitalize"
              >
                {ALL_EMOTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Optional correction notes..."
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 flex-1 min-w-[140px]"
              />

              <button
                onClick={handleApplyCorrection}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
              >
                Submit Correction
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
          No sentiment analysis has been run in this session yet. Type a sentence above or choose a quick prompt to test.
        </div>
      )}

      {/* Audit Feedback History Table */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Labeled Feedback Audit Records ({feedbackHistory.length})</span>
          <span className="text-[11px] text-cyan-400 font-normal">Stored locally in vcamp_sentiment_feedback</span>
        </h4>

        {feedbackHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Input Text</th>
                  <th className="py-2 px-2">Lang</th>
                  <th className="py-2 px-2">Original</th>
                  <th className="py-2 px-2">Corrected</th>
                  <th className="py-2 px-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {feedbackHistory.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50">
                    <td className="py-2 px-2 text-[10px] text-slate-400 whitespace-nowrap font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-2 max-w-xs truncate text-white">{item.inputText}</td>
                    <td className="py-2 px-2 uppercase font-mono text-[10px] text-cyan-400">{item.language}</td>
                    <td className="py-2 px-2 capitalize text-amber-300">{item.originalEmotion}</td>
                    <td className="py-2 px-2 capitalize font-semibold text-emerald-400">{item.correctedEmotion}</td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        item.feedbackType === 'confirmed_correct' 
                          ? 'bg-emerald-950 text-emerald-300' 
                          : 'bg-cyan-950 text-cyan-300'
                      }`}>
                        {item.feedbackType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No feedback entries recorded yet. User corrections and confirmations will appear here.</p>
        )}
      </div>
    </div>
  );
};
