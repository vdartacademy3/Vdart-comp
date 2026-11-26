import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import {
  ShieldCheck,
  FileText,
  Download,
  Lock,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const PrivacyAuditModule: React.FC = () => {
  const { employee } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/system/audit-logs');
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportData = async () => {
    let exportPayload: any = {
      employee_id: employee?.id,
      email: employee?.email,
      full_name: employee?.full_name,
      export_timestamp: new Date().toISOString(),
    };
    try {
      exportPayload = await apiClient.get('/system/privacy-export');
    } catch {}
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vcamp_privacy_export_${employee?.username || 'user'}.json`;
    a.click();
    setExportNotice('Privacy archive generated and downloaded.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1769D2]" /> Privacy Governance & Audit Trail
          </h2>
          <p className="text-xs text-[#64748B]">
            Security audit logs, tenant isolation policy, and personal data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EAF3FF] hover:bg-[#1769D2] text-[#1769D2] hover:text-white text-xs font-semibold border border-[#1769D2]/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export My Data
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#64748B]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#1769D2] text-xs font-bold">
            <Lock className="w-4 h-4" /> Tenant Isolation
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Database queries scope records to the authenticated session employee ID. Cross-user access returns 404/403.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Non-Surveillance Policy
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Administrators only see aggregated department metrics meeting k-anonymity thresholds — never private transcripts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#172B4D] text-xs font-bold">
            <Clock className="w-4 h-4 text-[#1769D2]" /> Retention & Erasure
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Employees control consent toggles, retention windows, and immediate personal history deletion.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1769D2]" /> Security Audit Events
          </h3>
          <span className="text-[11px] text-[#64748B]">{logs.length} Recorded Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[#64748B] uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Actor</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 text-[#64748B]">
                    {new Date(l.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EAF3FF] text-[#1769D2] border border-[#1769D2]/20 font-semibold font-sans">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-3 text-[#172B4D] font-sans">
                    {l.actor_email || `ID #${l.employee_id || 'System'}`}
                  </td>
                  <td className="p-3 text-[#64748B]">{l.ip_address || '127.0.0.1'}</td>
                  <td className="p-3 text-[#172B4D] font-sans max-w-xs truncate">{l.detail}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#64748B] font-sans">
                    No security events logged in this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
