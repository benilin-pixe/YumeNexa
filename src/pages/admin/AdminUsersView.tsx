import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Mail } from 'lucide-react';
import { getAllUsers, UserAdminRecord } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<UserAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'user'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');

  const { user, isAdmin, authLoading } = useAuth() as any;

  const loadUsers = async () => {
    if (authLoading || !user || !isAdmin) return;
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadUsers();
    }
  }, [authLoading, user, isAdmin]);

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
      {/* Filter / Search Bar */}
      <div className="bg-[#161224] rounded-3xl p-6 border border-[#2a243a] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>User Accounts Directory</span>
            </h2>
            <p className="text-xs text-[#a09cb0] mt-0.5">
              Inspect user registrations and account status.
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
                  <th className="py-3 px-5 text-right">Registered Date</th>
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

                      <td className="py-3.5 px-5 text-right text-[#a09cb0] font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
