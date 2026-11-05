import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  RefreshCw,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { getAllUsers, updateUserAccountStatus, updateUserRole, UserAdminRecord } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<UserAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'user'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [toastMessage, setToastMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    user: UserAdminRecord;
    action: 'status' | 'role';
    nextValue: string;
  } | null>(null);

  const showToast = (text: string, error = false) => {
    setToastMessage({ text, error });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const { user, isAdmin, authLoading } = useAuth() as any;

  const loadUsers = async () => {
    if (authLoading || !user || !isAdmin) return;
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err: any) {
      showToast(err.message || 'You don\'t have admin access.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadUsers();
    }
  }, [authLoading, user, isAdmin]);

  const handleExecuteAction = async () => {
    if (!confirmModal) return;
    const { user, action, nextValue } = confirmModal;

    try {
      if (action === 'status') {
        await updateUserAccountStatus(user.uid, nextValue as any, user.email);
        setUsers((prev) =>
          prev.map((u) => (u.uid === user.uid ? { ...u, status: nextValue as any } : u))
        );
        showToast(`Account status updated to ${nextValue.toUpperCase()} for ${user.email}.`);
      } else {
        await updateUserRole(user.uid, nextValue as any, user.email);
        setUsers((prev) =>
          prev.map((u) => (u.uid === user.uid ? { ...u, role: nextValue as any } : u))
        );
        showToast(`Account role set to ${nextValue.toUpperCase()} for ${user.email}.`);
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed', true);
    } finally {
      setConfirmModal(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm.trim() ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      u.uid.toLowerCase().includes(searchTerm.toLowerCase().trim());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            toastMessage.error
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {toastMessage.error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-[#161224] rounded-3xl p-6 border border-[#2a243a] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>User Accounts Directory</span>
            </h2>
            <p className="text-xs text-[#a09cb0] mt-0.5">
              Inspect user registrations, modify account roles, and manage platform permissions.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-[#0c0915] border border-[#2a243a] text-xs font-semibold text-[#a09cb0] hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Accounts</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#a09cb0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search email, name or UID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs text-[#f2effc] placeholder:text-[#6a667a] focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs text-[#f2effc] focus:outline-none focus:border-purple-500 transition cursor-pointer"
            >
              <option value="ALL">All Account Roles</option>
              <option value="user">Standard Users Only</option>
              <option value="admin">Administrators Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs text-[#f2effc] focus:outline-none focus:border-purple-500 transition cursor-pointer"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#161224] rounded-3xl border border-[#2a243a] shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#2a243a] flex items-center justify-between text-xs text-[#a09cb0]">
          <span>Found <strong className="text-white">{filteredUsers.length}</strong> matching user accounts</span>
          <span className="font-mono text-[11px]">Firestore Collection: users</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-[#a09cb0] space-y-3">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p>Loading registered accounts from Firestore...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#a09cb0]">
            No user accounts found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#f2effc]">
              <thead className="bg-[#0c0915] text-[#a09cb0] border-b border-[#2a243a] font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">User Profile</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a243a]">
                {filteredUsers.map((u) => {
                  const isInitialAdmin = u.email?.trim().toLowerCase() === 'benilin76@gmail.com';
                  return (
                    <tr key={u.uid} className="hover:bg-[#0c0915]/60 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.displayName || 'Anime Fan'}</span>
                          {isInitialAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                              Super Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[#a09cb0] font-mono text-[11px] mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#6a667a]" />
                          <span>{u.email}</span>
                        </div>
                        <div className="text-[10px] text-[#6a667a] font-mono mt-0.5">UID: {u.uid}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isInitialAdmin
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : u.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-[#0c0915] text-[#a09cb0] border border-[#2a243a]'
                          }`}
                        >
                          {isInitialAdmin ? 'Super Admin' : u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#a09cb0] font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-2">
                        {isInitialAdmin ? (
                          <span className="text-[10px] text-amber-400/80 font-mono italic px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                            Immutable Root
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  user: u,
                                  action: 'status',
                                  nextValue: u.status === 'active' ? 'suspended' : 'active',
                                })
                              }
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                u.status === 'active'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                            </button>

                            <button
                              onClick={() =>
                                setConfirmModal({
                                  user: u,
                                  action: 'role',
                                  nextValue: u.role === 'admin' ? 'user' : 'admin',
                                })
                              }
                              className="btn-secondary-pill px-3 py-1 text-[11px] font-semibold cursor-pointer"
                            >
                              Make {u.role === 'admin' ? 'User' : 'Admin'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#161224] border border-[#2a243a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-white">
                  Confirm Account {confirmModal.action === 'status' ? 'Status' : 'Role'} Update
                </h3>
                <p className="text-xs text-[#a09cb0]">Administrator verification required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to update <strong className="text-white">{confirmModal.user.email}</strong> to{' '}
              <strong className="text-purple-300 uppercase">{confirmModal.nextValue}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a243a]">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-[#0c0915] border border-[#2a243a] text-xs font-semibold text-[#a09cb0] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className="btn-primary-pill px-5 py-2 text-xs font-bold cursor-pointer"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
