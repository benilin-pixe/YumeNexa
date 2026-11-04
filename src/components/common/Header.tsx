import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Shield,
  Compass,
  Tv,
  Calendar,
  Newspaper,
  Bookmark,
  Sparkles,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAuth,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'watch', label: 'Watch', icon: Tv },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ];

  const allNavItems = isAdmin
    ? [...navItems, { id: 'admin', label: 'Admin', icon: Shield }]
    : navItems;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#0c0915]/90 backdrop-blur-md border-b border-[#2a243a] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-8">
        {/* Zone 1: Logo & Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="flex items-center gap-2.5 group whitespace-nowrap shrink-0 focus:outline-none"
        >
          <img
            src="/icon.svg"
            alt="YumeNexa Logo"
            className="w-8 h-8 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300"
          />
          <span className="text-xl font-black tracking-[0.2em] uppercase font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-sky-400">
            YumeNexa
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {allNavItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'admin' && activeTab.startsWith('admin'));
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#f8f7fa] bg-[#1d1830] border border-[#a855f7]/40 shadow-sm shadow-purple-900/40'
                    : 'text-[#a09cb0] hover:text-[#f8f7fa] hover:bg-[#161224]'
                }`}
              >
                {item.id === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search & Account Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161224] border border-[#2a243a] text-[#a09cb0] text-xs hover:text-[#f8f7fa] hover:border-[#a855f7]/40 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline whitespace-nowrap">Search anime...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#0c0915] rounded-md text-[#a09cb0] border border-[#2a243a]">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[#161224] border border-[#2a243a] text-[#a09cb0] hover:text-[#f8f7fa] hover:border-[#a855f7]/40 transition cursor-pointer"
            title={theme === 'dark' ? 'Switch Theme' : 'Switch Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
          </button>

          {/* Account Menu / Sign In Button */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#161224] transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-sky-400 p-[1.5px] shadow-md">
                  <div className="w-full h-full bg-[#0c0915] rounded-full flex items-center justify-center font-bold text-xs text-white">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#a09cb0] hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#161224] border border-[#2a243a] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#2a243a]">
                    <p className="text-xs font-bold text-[#f8f7fa] truncate">
                      {userProfile?.displayName || 'Anime Fan'}
                    </p>
                    <p className="text-[11px] text-[#a09cb0] truncate">{currentUser.email}</p>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveTab('account');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#f8f7fa] hover:bg-[#1d1830] rounded-xl transition cursor-pointer"
                    >
                      <User className="w-4 h-4 text-purple-400" />
                      My Account
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('watchlist');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#f8f7fa] hover:bg-[#1d1830] rounded-xl transition cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-purple-400" />
                      My Watchlist
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 rounded-xl transition cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        Admin Dashboard
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#2a243a]">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
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
              className="px-5 py-2 text-xs font-bold rounded-full btn-primary-pill cursor-pointer whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#a09cb0] hover:text-[#f8f7fa] transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Stacked Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#2a243a] px-4 pt-2 pb-4 space-y-2 bg-[#0c0915]/95 backdrop-blur-xl">
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1d1830] text-[#f8f7fa] border border-[#a855f7]/40'
                    : 'text-[#a09cb0] hover:bg-[#161224] hover:text-[#f8f7fa]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-[#a09cb0]'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

