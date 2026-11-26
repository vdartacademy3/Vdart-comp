import React, { useEffect, useState } from 'react';
import { BarChart3, ShieldCheck, RefreshCw, Lock } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../stores/authStore';

interface DeptAggregate {
  department: string;
  employee_count: number;
  record_count: number;
  suppressed_for_privacy: boolean;
  dominant_emotion?: string;
  workload_concern_rate?: number;
  positive_rate?: number;
}

export const HrAnalyticsTab: React.FC = () => {
  const { employee, authMode } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    total_analyzed: number;
    dominant_emotion: string;
    emotion_distribution: Record<string, number>;
    context_distribution: Record<string, number>;
    department_aggregates: DeptAggregate[];
    privacy_note: string;
  } | null>(null);

  const isAdmin = employee?.role === 'ADMIN' || employee?.role === 'SUPER_ADMIN';

  const fetchOrgAnalytics = async () => {
    if (authMode !== 'enterprise' || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/sentiment/analytics?scope=organization');
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load aggregated analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgAnalytics();
  }, [authMode, isAdmin]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-vcamp-primary" />
            HR Aggregated Workplace Trends
          </h3>
          <p className="text-xs text-vcamp-muted">
            Department-level aggregated workplace indicators. Private transcripts, personal memories, and individual profiles are strictly excluded.
          </p>
        </div>

        {authMode === 'enterprise' && isAdmin && (
          <button
            type="button"
            onClick={fetchOrgAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-vcamp-border text-xs font-semibold text-vcamp-text"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-vcamp-primary ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="p-3.5 rounded-2xl bg-vcamp-secondary border border-blue-200 flex items-start gap-2.5 text-xs text-vcamp-text">
        <ShieldCheck className="w-4 h-4 text-vcamp-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {summary?.privacy_note ||
            'Minimum k-anonymity aggregation thresholds apply. Departments with fewer than 3 participating employees are automatically suppressed. Sentiment data is never used for employee performance or termination decisions.'}
        </p>
      </div>

      {(!isAdmin || authMode !== 'enterprise') ? (
        <div className="bg-white p-8 rounded-2xl border border-vcamp-border shadow-card text-center space-y-2">
          <Lock className="w-7 h-7 text-vcamp-primary mx-auto" />
          <h4 className="text-sm font-bold text-vcamp-text">Admin / HR Enterprise Role Required</h4>
          <p className="text-xs text-vcamp-muted max-w-md mx-auto">
            Organization-level aggregated analytics are available only when connected to the Enterprise Server with an Admin or Super Admin role.
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-vcamp-error">
          {error}
        </div>
      ) : summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card">
              <span className="text-[10px] font-bold uppercase text-vcamp-muted">
                Aggregated Signals
              </span>
              <p className="text-xl font-bold text-vcamp-text mt-1">{summary.total_analyzed}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card">
              <span className="text-[10px] font-bold uppercase text-vcamp-muted">
                Dominant Trend
              </span>
              <p className="text-xl font-bold text-vcamp-primary capitalize mt-1">
                {summary.dominant_emotion}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card">
              <span className="text-[10px] font-bold uppercase text-vcamp-muted">
                Departments Tracked
              </span>
              <p className="text-xl font-bold text-vcamp-text mt-1">
                {summary.department_aggregates.length}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3">
            <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider">
              Department-Level Aggregated Breakdown
            </h4>
            {summary.department_aggregates.length === 0 ? (
              <p className="text-xs text-vcamp-muted">No department aggregates recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {summary.department_aggregates.map((dept) => (
                  <div
                    key={dept.department}
                    className="p-3 rounded-xl bg-slate-50 border border-vcamp-border flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-vcamp-text">{dept.department}</span>
                      <span className="text-vcamp-muted ml-2">
                        ({dept.employee_count} employees • {dept.record_count} signals)
                      </span>
                    </div>

                    {dept.suppressed_for_privacy ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                        Suppressed (below anonymity threshold)
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="capitalize font-semibold text-vcamp-primary">
                          Trend: {dept.dominant_emotion}
                        </span>
                        <span className="text-vcamp-muted">
                          Workload concern: {Math.round((dept.workload_concern_rate || 0) * 100)}%
                        </span>
                        <span className="text-vcamp-success font-semibold">
                          Positive: {Math.round((dept.positive_rate || 0) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
