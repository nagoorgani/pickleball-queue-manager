import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { authenticateAdmin, DEFAULT_LOGIN_ID, DEFAULT_PASSWORD } from '../utils/auth';
import { soundFx } from '../utils/sound';

interface LoginPageProps {
  onLoginSuccess: (adminId: string) => void;
  onViewAsSpectator?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onViewAsSpectator,
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authenticateAdmin(loginId, password);
      if (res.success) {
        soundFx.playCelebration();
        onLoginSuccess(loginId.trim());
      } else {
        soundFx.playUndo();
        setError(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillDefaults = () => {
    setLoginId(DEFAULT_LOGIN_ID);
    setPassword(DEFAULT_PASSWORD);
    setError(null);
    soundFx.playPop();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-lime-400 selection:text-slate-950">
      {/* Background Decorative Court Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-lime-500 to-emerald-400 p-0.5 shadow-xl shadow-lime-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-lime-400" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white tracking-tight">
            Pickleball Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
            Single-Admin Protected Access. Only one authorized manager can operate this court.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login ID Input */}
          <div>
            <label
              htmlFor="login-id"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              Admin Login ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-id"
                type="text"
                value={loginId}
                onChange={e => {
                  setLoginId(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm shadow-inner"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm shadow-inner"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-lime-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Log In to Court Manager</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Helper & Security Hint */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Default Admin Setup:</span>
            <button
              type="button"
              onClick={handleQuickFillDefaults}
              className="flex items-center gap-1 text-lime-400 hover:text-lime-300 font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Default Login</span>
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
            <p>
              • ID: <span className="font-mono text-slate-200 font-bold">{DEFAULT_LOGIN_ID}</span>
            </p>
            <p>
              • Password: <span className="font-mono text-slate-200 font-bold">{DEFAULT_PASSWORD}</span>
            </p>
            <p className="text-[10px] text-slate-500 pt-1">
              (You can change your login ID and password inside the app settings anytime)
            </p>
          </div>

          {onViewAsSpectator && (
            <button
              type="button"
              onClick={onViewAsSpectator}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1 cursor-pointer"
            >
              View Court Scoreboard as Spectator (Read-Only)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
