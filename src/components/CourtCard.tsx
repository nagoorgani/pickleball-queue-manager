import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  Clock,
  Shuffle,
  ArrowLeftRight,
  Edit2,
  UserMinus,
  Sparkles,
  Lock,
  Unlock,
  Trophy,
  Plus,
  Minus,
  User,
  Link,
  GripVertical,
} from 'lucide-react';
import type { CourtData, Player, DragItemData } from '../types';
import { useMatchTimer } from '../hooks/useMatchTimer';

interface CourtCardProps {
  court: CourtData;
  isAvailable: boolean;
  queue: Player[];
  onStartMatch: () => void;
  onFinishGame: (scores?: { teamA: number; teamB: number }) => void;
  onShuffleTeams: () => void;
  onSwapPartners: () => void;
  onUpdateScores: (teamA: number, teamB: number) => void;
  onToggleAvailability?: () => void;
  onEditPlayer: (player: Player) => void;
  onRequestRemovePlayer: (player: Player) => void;
  onDropOnCourt?: (dragData: DragItemData, targetCourtId: 1 | 2, targetTeam?: 'teamA' | 'teamB') => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  court,
  isAvailable,
  queue,
  onStartMatch,
  onFinishGame,
  onShuffleTeams,
  onSwapPartners,
  onUpdateScores,
  onToggleAvailability,
  onEditPlayer,
  onRequestRemovePlayer,
  onDropOnCourt,
}) => {
  const { formattedTime } = useMatchTimer(court.matchStartTime);
  const hasActiveMatch = Boolean(court.teamA && court.teamB && isAvailable);

  const [dragOverTeam, setDragOverTeam] = useState<'teamA' | 'teamB' | null>(null);

  const canStartMatch = !hasActiveMatch && isAvailable && queue.length >= 4;
  const previewFour = canStartMatch ? queue.slice(0, 4) : [];

  const displayTeamA = court.teamA || (previewFour.length === 4 ? [previewFour[0], previewFour[1]] : null);
  const displayTeamB = court.teamB || (previewFour.length === 4 ? [previewFour[2], previewFour[3]] : null);

  const adjustScore = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
      onUpdateScores(Math.max(0, court.currentScores.teamA + delta), court.currentScores.teamB);
    } else {
      onUpdateScores(court.currentScores.teamA, Math.max(0, court.currentScores.teamB + delta));
    }
  };

  const isCourt1 = court.id === 1;

  // Drag & Drop Handlers
  const handleDragStartCourtPlayer = (e: React.DragEvent, player: Player, team: 'teamA' | 'teamB') => {
    const dragData: DragItemData = {
      type: 'player',
      id: player.id,
      playerIds: [player.id],
      source: 'court',
      courtId: court.id,
      team,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverTeam = (e: React.DragEvent, team: 'teamA' | 'teamB') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTeam !== team) {
      setDragOverTeam(team);
    }
  };

  const handleDropOnTeam = (e: React.DragEvent, team: 'teamA' | 'teamB') => {
    e.preventDefault();
    setDragOverTeam(null);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const dragData = JSON.parse(raw) as DragItemData;
      if (onDropOnCourt) {
        onDropOnCourt(dragData, court.id, team);
      }
    } catch {
      // ignore
    }
  };

  if (!isAvailable) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-amber-400/50 rounded-3xl p-6 sm:p-8 text-center shadow-lg">
        <div className="max-w-md mx-auto py-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Court 2 Reserved
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
            Promotion matches or special events are currently running on Court 2. Open queue rotations are active exclusively on Court 1.
          </p>
          {onToggleAvailability && (
            <button
              type="button"
              onClick={onToggleAvailability}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 mx-auto shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Enable Court 2 for Open Queue</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border ${isCourt1 ? 'border-emerald-500/40' : 'border-sky-500/40'} rounded-3xl p-5 sm:p-6 shadow-xl space-y-4`}>
      {/* Court Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasActiveMatch ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                hasActiveMatch ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black font-['Outfit'] tracking-tight text-slate-900 dark:text-white">
                {court.name}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  hasActiveMatch
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}
              >
                {hasActiveMatch ? `Match #${court.matchNumber} LIVE` : 'Court Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Timer & Quick Score */}
        {hasActiveMatch && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {formattedTime}
              </span>
            </div>

            {(court.currentScores.teamA > 0 || court.currentScores.teamB > 0) && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-black text-xs font-['Outfit'] border border-slate-700">
                {court.currentScores.teamA} - {court.currentScores.teamB}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Controls */}
      {hasActiveMatch && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Admin Controls:</span>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onShuffleTeams}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Shuffle active players into new teams"
            >
              <Shuffle className="w-3.5 h-3.5 text-lime-500" />
              <span>Shuffle Teams</span>
            </button>

            <button
              type="button"
              onClick={onSwapPartners}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Swap player partners between Team A and Team B"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500" />
              <span>Swap Partners</span>
            </button>
          </div>
        </div>
      )}

      {/* Court Canvas: Team A vs Team B Drop Zones */}
      <div className="rounded-2xl bg-[#064e3b] p-3 sm:p-5 border-2 border-emerald-400/80 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-stretch">

          {/* TEAM A DROP TARGET */}
          <div
            onDragOver={e => handleDragOverTeam(e, 'teamA')}
            onDrop={e => handleDropOnTeam(e, 'teamA')}
            onDragLeave={() => setDragOverTeam(null)}
            className={`md:col-span-5 flex flex-col justify-between rounded-2xl p-3.5 border transition-all ${
              dragOverTeam === 'teamA'
                ? 'bg-emerald-500/30 border-lime-400 ring-2 ring-lime-400/60 scale-[1.01]'
                : 'bg-emerald-700/80 dark:bg-emerald-900/80 border-emerald-300/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-emerald-400/30 pb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 shadow-sm">
                Team A (Players 1 & 2)
              </span>
              {hasActiveMatch && (
                <span className="text-sm font-black font-['Outfit'] text-white">
                  {court.currentScores.teamA} pts
                </span>
              )}
            </div>

            {displayTeamA ? (
              <div className="space-y-2">
                {displayTeamA.map((player, idx) => (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={e => handleDragStartCourtPlayer(e, player, 'teamA')}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-emerald-400/40 shadow-sm flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                        A{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {player.name}
                          </p>
                          {player.groupId && (
                            <span title="Preset Duo"><Link className="w-3 h-3 text-lime-500 flex-shrink-0" /></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} played
                        </p>
                      </div>
                    </div>

                    {hasActiveMatch && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditPlayer(player)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestRemovePlayer(player)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Remove Player from Court"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-emerald-200/70 text-xs font-medium flex flex-col items-center justify-center gap-1.5">
                <User className="w-6 h-6 opacity-60" />
                <span>Drop Player or Group Here for Team A</span>
              </div>
            )}
          </div>

          {/* NET & KITCHEN */}
          <div className="md:col-span-1 flex md:flex-col items-center justify-center py-2 px-3 bg-emerald-900/90 dark:bg-emerald-950 rounded-xl border border-emerald-400/40 relative shadow-inner">
            <div className="z-10 bg-slate-900 border-2 border-lime-400 text-lime-400 rounded-full px-3 py-1 text-xs font-black tracking-widest uppercase shadow">
              VS
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300 hidden md:block mt-1.5 text-center">
              Net
            </span>
          </div>

          {/* TEAM B DROP TARGET */}
          <div
            onDragOver={e => handleDragOverTeam(e, 'teamB')}
            onDrop={e => handleDropOnTeam(e, 'teamB')}
            onDragLeave={() => setDragOverTeam(null)}
            className={`md:col-span-5 flex flex-col justify-between rounded-2xl p-3.5 border transition-all ${
              dragOverTeam === 'teamB'
                ? 'bg-sky-500/30 border-lime-400 ring-2 ring-lime-400/60 scale-[1.01]'
                : 'bg-emerald-700/80 dark:bg-emerald-900/80 border-sky-300/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-emerald-400/30 pb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-sky-400 text-sky-950 shadow-sm">
                Team B (Players 3 & 4)
              </span>
              {hasActiveMatch && (
                <span className="text-sm font-black font-['Outfit'] text-white">
                  {court.currentScores.teamB} pts
                </span>
              )}
            </div>

            {displayTeamB ? (
              <div className="space-y-2">
                {displayTeamB.map((player, idx) => (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={e => handleDragStartCourtPlayer(e, player, 'teamB')}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-sky-400/40 shadow-sm flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-sky-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                        B{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {player.name}
                          </p>
                          {player.groupId && (
                            <span title="Preset Duo"><Link className="w-3 h-3 text-sky-400 flex-shrink-0" /></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} played
                        </p>
                      </div>
                    </div>

                    {hasActiveMatch && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditPlayer(player)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestRemovePlayer(player)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Remove Player from Court"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-emerald-200/70 text-xs font-medium flex flex-col items-center justify-center gap-1.5">
                <User className="w-6 h-6 opacity-60" />
                <span>Drop Player or Group Here for Team B</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Live Scorekeeper */}
      {hasActiveMatch && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Match Scoring:</span>
            </span>
            <button
              type="button"
              onClick={() => onUpdateScores(0, 0)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Reset 0 - 0
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Team A Point Controls */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-['Outfit'] text-emerald-600 dark:text-emerald-400">
                  {court.currentScores.teamA}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Team A</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustScore('A', -1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer"
                  aria-label="Subtract Team A score"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustScore('A', 1)}
                  className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center text-sm font-bold cursor-pointer shadow-sm"
                  aria-label="Add Team A point"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Team B Point Controls */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-500/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-['Outfit'] text-sky-600 dark:text-sky-400">
                  {court.currentScores.teamB}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Team B</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustScore('B', -1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer"
                  aria-label="Subtract Team B score"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustScore('B', 1)}
                  className="w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center text-sm font-bold cursor-pointer shadow-sm"
                  aria-label="Add Team B point"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Finish / Start Action Button */}
      <div>
        {hasActiveMatch ? (
          <button
            type="button"
            onClick={() => onFinishGame(court.currentScores)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-lime-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-base sm:text-lg shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle className="w-5 h-5 stroke-[2.5]" />
            <span>
              Finish {court.name} Match ({court.currentScores.teamA} - {court.currentScores.teamB})
            </span>
          </button>
        ) : canStartMatch ? (
          <button
            type="button"
            onClick={onStartMatch}
            className="w-full py-4 px-6 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-base sm:text-lg shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Match on {court.name}</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs text-center font-semibold">
            Waiting for at least 4 waiting players in queue to start {court.name}.
          </div>
        )}
      </div>
    </div>
  );
};
