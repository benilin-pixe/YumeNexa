import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatAuthError } from '../../utils/authErrors';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, canClose = true }) => {
  const { loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) throw new Error('Email is required');

      if (mode === 'signin') {
        if (!password) throw new Error('Password is required');
        await loginWithEmail(cleanEmail, password);
        onClose();
      } else if (mode === 'signup') {
        if (!displayName.trim()) throw new Error('Display Name is required');
        if (!password) throw new Error('Password is required');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long');
        await registerWithEmail(cleanEmail, password, displayName.trim());
        onClose();
      } else if (mode === 'reset') {
        await resetPassword(cleanEmail);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: unknown) {
      console.error('[AuthModal] Error encountered:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px] mx-auto shadow-xl shadow-violet-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center font-bold text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-cyan-300 font-display text-xl">
              Y
            </div>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            {mode === 'signin' ? 'Welcome Back to YumeNexa' : mode === 'signup' ? 'Create Your Account' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signin'
              ? 'Sign in to access your personal watchlist and watch history.'
              : mode === 'signup'
              ? 'Join thousands of anime fans and sync across devices.'
              : 'Enter your email address to receive password reset instructions.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center">
            {message}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Display Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Your anime username"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-300">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[10px] text-violet-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-xl shadow-violet-600/30 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? 'Processing...'
              : mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Reset Email'}
          </button>
        </form>

        {/* Footer switch modes */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          {mode === 'signin' ? (
            <p>
              Don’t have an account?{' '}
              <button onClick={() => setMode('signup')} className="font-semibold text-violet-400 hover:underline cursor-pointer">
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="font-semibold text-violet-400 hover:underline cursor-pointer">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
