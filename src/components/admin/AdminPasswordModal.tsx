import React, { useState } from 'react';
import { Lock, Shield, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const ADMIN_AUTH_SESSION_KEY = 'yumenexa_admin_authenticated';
export const ADMIN_SECRET_PASSWORD = 'benilin';

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === 'true';
}

export function setAdminAuthenticated(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'true');
  }
}

export function clearAdminAuthentication(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
  }
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim() === ADMIN_SECRET_PASSWORD) {
      setAdminAuthenticated();
      setPassword('');
      setError(null);
      onSuccess();
    } else {
      setAttemptCount((prev) => prev + 1);
      setError('Incorrect password. Please enter the valid admin password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#161224] border border-[#2a243a] shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-sky-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-lg shadow-purple-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-display text-white">YumeNexa Admin Center</h2>
            <p className="text-xs text-[#a09cb0] mt-1">
              Restricted management zone. Enter the administrator password to access the panel.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#f2effc] flex items-center justify-between">
              <span>Admin Password</span>
              <span className="text-[10px] text-[#a09cb0] font-mono">Protected Zone</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a09cb0]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password..."
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0c0915] border border-[#2a243a] text-sm text-[#f2effc] placeholder:text-[#6a667a] focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#a09cb0] hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-rose-400 font-medium pt-1 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-full btn-primary-pill text-xs font-bold shadow-lg shadow-purple-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-full bg-transparent hover:bg-[#1d1830] text-[#a09cb0] hover:text-[#f2effc] text-xs font-semibold transition cursor-pointer"
              >
                Return to Website
              </button>
            )}
          </div>
        </form>

        <div className="pt-2 border-t border-[#2a243a] flex items-center justify-between text-[11px] text-[#a09cb0]">
          <span>Security Passcode Gate</span>
          <span className="flex items-center gap-1 text-purple-400 font-mono">
            <Sparkles className="w-3 h-3" /> YumeNexa OS
          </span>
        </div>
      </div>
    </div>
  );
};
