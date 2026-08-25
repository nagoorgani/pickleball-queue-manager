import React from 'react';
import {
  SlidersHorizontal,
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { CourtData, Player, DragItemData } from '../types';
import { CourtCard } from './CourtCard';

interface CourtViewProps {
  court1: CourtData;
  court2: CourtData;
  isCourt2Available: boolean;
  queue: Player[];
  totalPlayers: number;
  onToggleCourt2: () => void;
  onStartCourtMatch: (courtId: 1 | 2) => void;
  onStartAllCourts: () => void;
  onFinishCourtGame: (courtId: 1 | 2, scores?: { teamA: number; teamB: number }) => void;
  onShuffleCourt: (courtId: 1 | 2) => void;
  onSwapCourt: (courtId: 1 | 2) => void;
  onUpdateCourtScores: (courtId: 1 | 2, teamA: number, teamB: number) => void;
  onRequestResetSession: () => void;
  onEditPlayer: (player: Player) => void;
  onRequestRemovePlayer: (player: Player) => void;
  onDropOnCourt?: (dragData: DragItemData, targetCourtId: 1 | 2, targetTeam?: 'teamA' | 'teamB', targetPlayerId?: string) => void;
}

export const CourtView: React.FC<CourtViewProps> = ({
  court1,
  court2,
  isCourt2Available,
  queue,
  totalPlayers,
  onToggleCourt2,
  onStartCourtMatch,
  onStartAllCourts,
  onFinishCourtGame,
  onShuffleCourt,
  onSwapCourt,
  onUpdateCourtScores,
  onRequestResetSession,
  onEditPlayer,
  onRequestRemovePlayer,
  onDropOnCourt,
}) => {
  const hasAnyActiveCourt = Boolean(court1.teamA || (isCourt2Available && court2.teamA));
  const bothCourtsEmpty = !court1.teamA && (!isCourt2Available || !court2.teamA);

  return (
    <section className="space-y-5">
      {/* Top Banner: Active Courts Mode Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black font-['Outfit'] tracking-tight text-slate-900 dark:text-white">
              Section 1: Active Courts & Matches
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-500/15 text-lime-600 dark:text-lime-400 border border-lime-500/20">
              {isCourt2Available ? '2 Courts Mode' : '1 Court Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isCourt2Available
              ? 'Both Court 1 and Court 2 are in rotation for open queue players'
              : 'Court 2 is currently reserved for promotion matches / special events'}
          </p>
        </div>

        {/* Action Buttons: Toggle Switch & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onToggleCourt2}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-sm transition-all active:scale-95 cursor-pointer ${
              isCourt2Available
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-400/50'
                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-400/50'
            }`}
          >
            {isCourt2Available ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Switch to 1 Court (Reserve Court 2)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Switch to 2 Courts (Enable Court 2)</span>
              </>
            )}
            <SlidersHorizontal className="w-3.5 h-3.5 opacity-60" />
          </button>

          {hasAnyActiveCourt && (
            <button
              type="button"
              onClick={onRequestResetSession}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all active matches and return players to queue"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Reset Courts</span>
            </button>
          )}
        </div>
      </div>

      {/* If all courts empty and we have >= 4 players: Global Start Session Button */}
      {bothCourtsEmpty && totalPlayers >= 4 && (
        <button
          type="button"
          onClick={onStartAllCourts}
          className="w-full py-4 px-6 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-lg sm:text-xl shadow-xl shadow-lime-500/25 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>
            Start Session ({isCourt2Available ? 'Fill Available Courts' : 'Start Court 1'})
          </span>
        </button>
      )}

      {/* Courts Layout Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* COURT 1 CARD */}
        <CourtCard
          court={court1}
          isAvailable={true}
          queue={queue}
          onStartMatch={() => onStartCourtMatch(1)}
          onFinishGame={scores => onFinishCourtGame(1, scores)}
          onShuffleTeams={() => onShuffleCourt(1)}
          onSwapPartners={() => onSwapCourt(1)}
          onUpdateScores={(a, b) => onUpdateCourtScores(1, a, b)}
          onEditPlayer={onEditPlayer}
          onRequestRemovePlayer={onRequestRemovePlayer}
          onDropOnCourt={onDropOnCourt}
        />

        {/* COURT 2 CARD */}
        <CourtCard
          court={court2}
          isAvailable={isCourt2Available}
          queue={queue}
          onStartMatch={() => onStartCourtMatch(2)}
          onFinishGame={scores => onFinishCourtGame(2, scores)}
          onShuffleTeams={() => onShuffleCourt(2)}
          onSwapPartners={() => onSwapCourt(2)}
          onUpdateScores={(a, b) => onUpdateCourtScores(2, a, b)}
          onToggleAvailability={onToggleCourt2}
          onEditPlayer={onEditPlayer}
          onRequestRemovePlayer={onRequestRemovePlayer}
          onDropOnCourt={onDropOnCourt}
        />
      </div>
    </section>
  );
};
