import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Lock, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Search,
  Building
} from 'lucide-react';

export const EmployeeManagementModule: React.FC = () => {
  const { employee: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New Employee Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
  });

  // Password reset modal state
  const [resetTargetId, setResetTargetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/employees');
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    }
  }, [isAdmin]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/employees', newForm);
      setSuccess(`Employee "${newForm.full_name}" registered successfully!`);
      setShowAddModal(false);
      setNewForm({
        email: '',
        username: '',
        full_name: '',
        password: '',
        role: 'EMPLOYEE',
        department: 'Engineering',
      });
      fetchEmployees();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
    }
  };

  const handleToggleStatus = async (emp: any) => {
    try {
      await apiClient.put(`/employees/${emp.id}`, {
        is_active: !emp.is_active,
      });
      fetchEmployees();
      setSuccess(`Employee status updated.`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update employee status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetId || !newPassword) return;
    try {
      await apiClient.post(`/employees/${resetTargetId}/reset-password`, {
        new_password: newPassword,
      });
      setSuccess('Password updated successfully');
      setResetTargetId(null);
      setNewPassword('');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 animate-in fade-in">
        <div className="inline-flex p-3 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white">Administrator Access Required</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The employee directory and organization account administration is restricted to System Administrators and Super Admins.
        </p>
      </div>
    );
  }

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Employee Directory & RBAC
          </h2>
          <p className="text-xs text-slate-400">
            Manage authenticated employee credentials, role permissions, and tenant isolation policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-900/30"
          >
            <UserPlus className="w-4 h-4" /> Add New Employee
          </button>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name, email, or department..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{emp.full_name}</div>
                    <div className="text-[11px] text-slate-400">{emp.email} (@{emp.username})</div>
                  </td>
                  <td className="p-3.5 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {emp.department || 'General'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        emp.role === 'SUPER_ADMIN'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                          : emp.role === 'ADMIN'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {emp.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        emp.is_active ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                      {emp.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setResetTargetId(emp.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      title="Reset Password"
                    >
                      <Key className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                      Reset Pass
                    </button>
                    <button
                      onClick={() => handleToggleStatus(emp)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        emp.is_active
                          ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {emp.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No employees matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" /> Register Employee
            </h3>
            <p className="text-xs text-slate-400">
              Create an individual enterprise account with Argon2id password hashing and dedicated isolated database scope.
            </p>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newForm.full_name}
                    onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })}
                    placeholder="e.g. Priyan Kumar"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newForm.username}
                    onChange={(e) => setNewForm({ ...newForm, username: e.target.value })}
                    placeholder="priyan.k"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="priyan@company.com"
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={newForm.department}
                    onChange={(e) => setNewForm({ ...newForm, department: e.target.value })}
                    placeholder="Engineering / Product"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Role Permission</label>
                <select
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="EMPLOYEE">Employee (Personal Companion & Isolation)</option>
                  <option value="ADMIN">Administrator (Org Analytics & User Management)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full System Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> Reset Employee Password
            </h3>
            <p className="text-[11px] text-slate-400">
              Provide a secure new password. It will be immediately hashed using Argon2id.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetTargetId(null);
                    setNewPassword('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
