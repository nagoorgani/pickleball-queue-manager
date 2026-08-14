import React from 'react';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  RotateCcw,
  History,
  Trash2,
  Undo2,
  SlidersHorizontal,
  Lock,
  CheckCircle2,
  LogOut,
  Shield,
  KeyRound,
} from 'lucide-react';
import type { CourtData } from '../types';

interface HeaderProps {
  totalPlayers: number;
  queueCount: number;
  court1: CourtData;
  court2: CourtData;
  isCourt2Available: boolean;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  canUndo: boolean;
  lastActionDescription?: string;
  adminUsername: string;
  onToggleCourt2: () => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onUndo: () => void;
  onOpenHistory: () => void;
  onOpenAdminSettings: () => void;
  onLogout: () => void;
  onRequestResetSession: () => void;
  onRequestClearAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalPlayers,
  queueCount,
  court1,
  court2,
  isCourt2Available,
  theme,
  soundEnabled,
  canUndo,
  lastActionDescription,
  adminUsername,
  onToggleCourt2,
  onToggleTheme,
  onToggleSound,
  onUndo,
  onOpenHistory,
  onOpenAdminSettings,
  onLogout,
  onRequestResetSession,
  onRequestClearAll,
}) => {
  const activeCourtsCount = (court1.teamA ? 1 : 0) + (isCourt2Available && court2.teamA ? 1 : 0);

  return (
    <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Logo and Court Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Pickleball SVG Logo */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-lime-500 to-emerald-400 p-0.5 shadow-md shadow-lime-500/20 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="w-5 h-5 rounded-full bg-lime-400 flex items-center justify-center shadow-sm">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-slate-900" />
                    <div className="w-1 h-1 rounded-full bg-slate-900" />
                    <div className="w-1 h-1 rounded-full bg-slate-900" />
                    <div className="w-1 h-1 rounded-full bg-slate-900" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black font-['Outfit'] tracking-tight text-slate-900 dark:text-white leading-none">
                  Pickleball Queue Manager
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-lime-500/15 text-lime-600 dark:text-lime-400 border border-lime-500/20">
                  {isCourt2Available ? '2 Courts' : '1 Court'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Fair Turn Rotations • Single-Admin Controlled • Zero Disputes
              </p>
            </div>
          </div>
        </div>

        {/* Center: Court 2 Promotion Mode Toggle Switch */}
        <div className="flex items-center justify-between sm:justify-center">
          <button
            type="button"
            onClick={onToggleCourt2}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
              isCourt2Available
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-400/50'
                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-400/50'
            }`}
            title="Toggle between 2 active courts and 1 court (when Court 2 is reserved for promotion matches)"
          >
            {isCourt2Available ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">Both Courts Active</span>
                <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded text-[10px] font-black">
                  2 COURTS
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">Court 2 Reserved (Promotion Match)</span>
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded text-[10px] font-black">
                  1 COURT
                </span>
              </>
            )}
            <SlidersHorizontal className="w-3.5 h-3.5 opacity-60 ml-1" />
          </button>
        </div>

        {/* Action Controls & Admin Session */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-wrap">
          {/* Quick Stats Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mr-1">
            <span>{totalPlayers} Players</span>
            <span>•</span>
            <span>{queueCount} Waiting</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">{activeCourtsCount} Active</span>
          </div>

          {/* Admin Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/20 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span className="max-w-[80px] truncate">{adminUsername}</span>
          </div>

          {/* Admin Security / Change Password */}
          <button
            type="button"
            onClick={onOpenAdminSettings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Admin Security & Password Settings"
            aria-label="Admin Settings"
          >
            <KeyRound className="w-4 h-4 text-amber-500" />
          </button>

          {/* Undo Button */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              canUndo
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer'
                : 'opacity-40 bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-transparent cursor-not-allowed'
            }`}
            title={canUndo ? `Undo: ${lastActionDescription}` : 'No actions to undo'}
            aria-label="Undo last action"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Match History Opener */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="View Match History & Stats"
            aria-label="View history"
          >
            <History className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-lime-600 dark:text-lime-400 border-slate-200 dark:border-slate-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title={soundEnabled ? 'Mute Court Sounds' : 'Unmute Court Sounds'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Reset Session */}
          <button
            type="button"
            onClick={onRequestResetSession}
            disabled={totalPlayers === 0}
            className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Reset Session (Return all court players to queue)"
            aria-label="Reset Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Clear All */}
          <button
            type="button"
            onClick={onRequestClearAll}
            disabled={totalPlayers === 0}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Clear All Players"
            aria-label="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
            title="Log Out of Admin Session"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
