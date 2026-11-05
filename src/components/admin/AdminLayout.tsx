import React from 'react';
import {
  LayoutDashboard,
  Film,
  Users,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { clearAdminAuthentication } from '../../components/admin/AdminPasswordModal';

export type AdminSection = 'dashboard' | 'movies' | 'users' | 'notifications';

interface AdminLayoutProps {
  currentSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onNavigate,
  onExitAdmin,
  children,
}) => {
  const navItems = [
    {
      id: 'dashboard' as AdminSection,
      label: 'Dashboard',
      description: 'Analytics, metrics & health',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'movies' as AdminSection,
      label: 'Anime',
      description: 'Anime catalogue & releases',
      icon: Film,
      badge: null,
    },
    {
      id: 'users' as AdminSection,
      label: 'Users',
      description: 'Directory, roles & bans',
      icon: Users,
      badge: null,
    },
    {
      id: 'notifications' as AdminSection,
      label: 'Notifications',
      description: 'Global system announcements',
      icon: Bell,
      badge: null,
    },
  ];

  const handleLogout = () => {
    clearAdminAuthentication();
    onExitAdmin();
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Header Bar */}
      <div className="bg-[#161224] rounded-3xl p-5 sm:p-6 border border-[#2a243a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30 shrink-0">
            <div className="w-full h-full bg-[#0c0915] rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-display text-white">
                YumeNexa Admin Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Unlocked
              </span>
            </div>
            <p className="text-xs text-[#a09cb0] mt-0.5">
              Secure control console for anime catalogue, registered users, and announcements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c0915] border border-[#2a243a] text-xs font-semibold text-[#a09cb0] hover:text-white hover:border-purple-500/40 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Site</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
            title="Lock Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Stand-Alone Section Nav Tabs (Visible on both desktop & mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group ${
                isActive
                  ? 'bg-gradient-to-br from-purple-900/40 via-[#1d1830] to-[#161224] border-purple-500/60 shadow-lg shadow-purple-600/20 scale-[1.01]'
                  : 'bg-[#161224] border-[#2a243a] hover:border-purple-500/40 hover:bg-[#1a152c]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-2.5 rounded-xl border transition ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-[#0c0915] text-purple-400 border-[#2a243a] group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold font-display ${
                      isActive ? 'text-white' : 'text-[#f2effc] group-hover:text-purple-300'
                    }`}
                  >
                    {item.label}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-purple-400 translate-x-1' : 'text-[#6a667a] group-hover:text-[#a09cb0]'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#a09cb0] mt-0.5 truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stand-Alone Content Area */}
      <div className="w-full">{children}</div>
    </div>
  );
};
