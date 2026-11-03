import React, { useState } from 'react';
import { Search, Moon, Sun, User, LogOut, Shield, Compass, Tv, Calendar, Newspaper, Bookmark, Sparkles, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenSearch, onOpenAuth }) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'watch', label: 'Watch', icon: Tv },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/60 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 group text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-bold text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-cyan-300 font-display text-lg">
              Y
            </div>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-200 to-slate-400 dark:from-white dark:to-slate-300 light:from-slate-900 light:to-slate-700 bg-clip-text text-transparent">
              Yume<span className="text-violet-400">Nexa</span>
            </span>
            <span className="hidden sm:block text-[9px] uppercase tracking-wider text-violet-400/80 font-medium -mt-1">
              Next Anime Universe
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-300 text-slate-400 text-xs hover:text-slate-200 hover:border-slate-700 transition"
          >
            <Search className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden lg:inline">Search anime, news...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-slate-800 rounded text-slate-400 border border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-400 hover:text-slate-200 transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
          </button>

          {/* User Profile / Auth */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/60 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 p-[1.5px]">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-semibold text-xs text-white">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800/80">
                    <p className="text-sm font-semibold text-white truncate">{userProfile?.displayName || 'User'}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('account');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-violet-600/20 rounded-xl transition"
                    >
                      <User className="w-4 h-4 text-violet-400" />
                      My Account
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('watchlist');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-violet-600/20 rounded-xl transition"
                    >
                      <Bookmark className="w-4 h-4 text-violet-400" />
                      My Watchlist
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 rounded-xl transition"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        Admin Dashboard
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
