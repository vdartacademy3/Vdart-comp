import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Building,
} from 'lucide-react';

export const EmployeeManagementModule: React.FC = () => {
  const { employee: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
  });

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
      setSuccess(`Employee "${newForm.full_name}" registered successfully.`);
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
      setSuccess('Employee status updated.');
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
      setSuccess('Password updated successfully.');
      setResetTargetId(null);
      setNewPassword('');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
        <div className="inline-flex p-3 rounded-full bg-amber-50 border border-amber-200 text-amber-600">
          <Shield className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#172B4D]">Administrator Access Required</h3>
        <p className="text-xs text-[#64748B] max-w-md mx-auto">
          The employee directory and role administration module is restricted to Administrators and Super Admins.
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1769D2]" /> Employee Directory & RBAC
          </h2>
          <p className="text-xs text-[#64748B]">
            Manage employee accounts, role permissions, and active status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add New Employee
          </button>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#64748B]"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by name, email, or department..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-[#1769D2] text-xs text-[#172B4D] placeholder-slate-400 outline-none shadow-sm"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[#64748B] uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#EAF3FF]/40 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-[#172B4D]">{emp.full_name}</div>
                    <div className="text-[11px] text-[#64748B]">{emp.email} (@{emp.username})</div>
                  </td>
                  <td className="p-3.5 text-[#172B4D]">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#64748B]" />
                      {emp.department || 'General'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        emp.role === 'SUPER_ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : emp.role === 'ADMIN'
                          ? 'bg-[#EAF3FF] text-[#1769D2] border-[#1769D2]/20'
                          : 'bg-slate-100 text-[#64748B] border-slate-200'
                      }`}
                    >
                      {emp.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                        emp.is_active ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {emp.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setResetTargetId(emp.id)}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[#172B4D] text-[11px] font-medium transition-colors"
                    >
                      <Key className="w-3 h-3 inline mr-1 text-amber-600" />
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleToggleStatus(emp)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                        emp.is_active
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {emp.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#64748B]">
                    No employees matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#1769D2]" /> Register Employee
            </h3>
            <p className="text-xs text-[#64748B]">
              Create an isolated employee account secured with Argon2id password hashing.
            </p>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newForm.full_name}
                    onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })}
                    placeholder="e.g. Priyan Kumar"
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newForm.username}
                    onChange={(e) => setNewForm({ ...newForm, username: e.target.value })}
                    placeholder="priyan.k"
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="priyan@company.com"
                  className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">Department</label>
                  <input
                    type="text"
                    value={newForm.department}
                    onChange={(e) => setNewForm({ ...newForm, department: e.target.value })}
                    placeholder="Engineering"
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">Role Permission</label>
                <select
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
                >
                  <option value="EMPLOYEE">Employee (Personal Companion & Privacy)</option>
                  <option value="ADMIN">Administrator (Aggregated HR Analytics & Users)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full System Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[#64748B] hover:text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1255AC] text-white font-semibold text-xs shadow-sm"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" /> Reset Employee Password
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Enter a secure new password. It will be hashed immediately with Argon2id.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-[#172B4D] outline-none focus:border-[#1769D2]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetTargetId(null);
                    setNewPassword('');
                  }}
                  className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172B4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#1769D2] hover:bg-[#1255AC] text-white rounded-lg text-xs font-semibold"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
