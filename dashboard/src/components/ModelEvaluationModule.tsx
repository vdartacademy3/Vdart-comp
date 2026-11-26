import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  Cpu,
  Play,
  Layers,
  Globe,
  RefreshCw,
  Info,
} from 'lucide-react';

export const ModelEvaluationModule: React.FC = () => {
  const [evalData, setEvalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runningEval, setRunningEval] = useState(false);
  const [evalStatusMsg, setEvalStatusMsg] = useState<string | null>(null);

  const fetchLatestEval = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/evaluation/latest');
      setEvalData(data);
    } catch (e) {
      console.warn('No existing evaluation found:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestEval();
  }, []);

  const handleRunEvaluation = async () => {
    setRunningEval(true);
    setEvalStatusMsg('Running 46-sample multilingual benchmark across English, Tamil & Tanglish...');
    try {
      const result = await apiClient.post('/evaluation/run', {
        notes: 'Dashboard empirical evaluation suite',
      });
      setEvalData(result);
      setEvalStatusMsg('Evaluation completed with live scikit-learn metrics.');
      setTimeout(() => setEvalStatusMsg(null), 4000);
    } catch (e: any) {
      setEvalStatusMsg(`Evaluation failed: ${e.message}`);
    } finally {
      setRunningEval(false);
    }
  };

  const confusionMatrix = evalData?.confusion_matrix || {};
  const confusionLabels: string[] = confusionMatrix?.labels || [];
  const confusionMatrixData: number[][] = confusionMatrix?.matrix || [];
  const langBreakdown = evalData?.language_breakdown || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#1769D2]" /> Sentiment Model Evaluation
          </h2>
          <p className="text-xs text-[#64748B]">
            Scikit-learn benchmarks across 46 annotated sentences in English, Tamil Unicode & Tanglish.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunEvaluation}
            disabled={runningEval}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${runningEval ? 'animate-spin' : ''}`} />
            {runningEval ? 'Evaluating...' : 'Run Live Benchmark (46 Samples)'}
          </button>

          <button
            onClick={fetchLatestEval}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#64748B]"
            title="Refresh Evaluation"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {evalStatusMsg && (
        <div className="p-3 rounded-lg bg-[#EAF3FF] border border-[#1769D2]/20 text-[#172B4D] text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#1769D2]" />
          <span>{evalStatusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium">Overall Accuracy</span>
          <div className="text-2xl font-bold text-[#1769D2] font-mono">
            {evalData?.accuracy !== undefined ? `${(evalData.accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <span className="text-[10px] text-[#64748B]">46-sample corpus</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium">Macro F1</span>
          <div className="text-2xl font-bold text-[#172B4D] font-mono">
            {evalData?.macro_f1 !== undefined ? `${(evalData.macro_f1 * 100).toFixed(1)}%` : '--'}
          </div>
          <span className="text-[10px] text-[#64748B]">Equal class weight</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium">Weighted F1</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {evalData?.weighted_f1 !== undefined ? `${(evalData.weighted_f1 * 100).toFixed(1)}%` : '--'}
          </div>
          <span className="text-[10px] text-[#64748B]">Support weighted</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium">Model Version</span>
          <div className="text-sm font-bold text-[#172B4D] font-mono truncate pt-1">
            {evalData?.model_version || 'vcamp-v3'}
          </div>
          <span className="text-[10px] text-[#64748B]">Active Classifier</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium">Test Samples</span>
          <div className="text-2xl font-bold text-[#172B4D] font-mono">
            {evalData?.sample_count || 46}
          </div>
          <span className="text-[10px] text-[#64748B]">Multilingual Set</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#1769D2]" /> Dialect Accuracy Breakdown
          </h3>

          <div className="space-y-3 pt-1">
            {[
              { key: 'ta', label: 'Tamil Native Script (ta)' },
              { key: 'tanglish', label: 'Tanglish Romanized (tanglish)' },
              { key: 'en', label: 'English (en)' },
            ].map(({ key, label }) => {
              const langStats = langBreakdown[key];
              const acc = langStats?.accuracy !== undefined ? (langStats.accuracy * 100).toFixed(1) : '--';
              const correct = langStats?.correct_samples ?? '--';
              const total = langStats?.total_samples ?? '--';

              return (
                <div key={key} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#172B4D]">{label}</span>
                    <span className="font-mono text-[#1769D2] font-bold">{acc}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-[#1769D2] transition-all duration-300"
                      style={{ width: `${acc !== '--' ? acc : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-[#64748B] text-right">
                    {correct} of {total} samples correct
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1769D2]" /> Empirical Confusion Matrix
            </h3>
            <span className="text-[11px] text-[#64748B] font-mono">
              {evalData?.timestamp ? new Date(evalData.timestamp).toLocaleTimeString() : 'Run evaluation'}
            </span>
          </div>

          {confusionLabels.length > 0 && confusionMatrixData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-[10px] border-collapse font-mono">
                <thead>
                  <tr>
                    <th className="p-1.5 text-left text-[#64748B] font-sans">True \ Pred</th>
                    {confusionLabels.map((lbl, idx) => (
                      <th key={idx} className="p-1.5 text-[#64748B] truncate max-w-[50px]" title={lbl}>
                        {lbl.substring(0, 4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confusionMatrixData.map((row, rowIdx) => {
                    const rowLabel = confusionLabels[rowIdx] || `C${rowIdx}`;
                    return (
                      <tr key={rowIdx} className="border-t border-slate-100">
                        <td className="p-1.5 text-left font-semibold text-[#172B4D] font-sans max-w-[70px] truncate" title={rowLabel}>
                          {rowLabel}
                        </td>
                        {row.map((val, colIdx) => {
                          const isDiag = rowIdx === colIdx;
                          let bg = 'bg-slate-50 text-slate-400';
                          if (val > 0) {
                            bg = isDiag
                              ? 'bg-[#EAF3FF] text-[#1769D2] font-bold border border-[#1769D2]/20'
                              : 'bg-red-50 text-red-700';
                          }
                          return (
                            <td key={colIdx} className={`p-1.5 ${bg}`}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-[#64748B] text-xs space-y-2">
              <p>No evaluation snapshot loaded yet.</p>
              <button
                onClick={handleRunEvaluation}
                className="px-3.5 py-1.5 rounded-lg bg-[#EAF3FF] text-[#1769D2] hover:bg-[#1769D2]/15 text-xs font-semibold"
              >
                Run Benchmark
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
