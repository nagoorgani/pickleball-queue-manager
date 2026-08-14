import React from 'react';
import { Trophy, Clock, Users, X, History, Award } from 'lucide-react';
import type { MatchRecord, Player } from '../types';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchRecord[];
  allPlayers: Player[];
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  matches,
  allPlayers,
}) => {
  if (!isOpen) return null;

  const totalMatchTime = matches.reduce((acc, m) => acc + m.durationSeconds, 0);
  const avgMatchTime = matches.length > 0 ? Math.round(totalMatchTime / matches.length) : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Sort players by games played
  const sortedPlayers = [...allPlayers].sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Outfit']">Session Match History</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Summary of finished court games, scores & rotations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <div className="flex justify-center items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Matches</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
              {matches.length}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <div className="flex justify-center items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>Avg. Duration</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
              {matches.length > 0 ? `${Math.floor(avgMatchTime / 60)}m` : '0m'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <div className="flex justify-center items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5 text-lime-500" />
              <span>Total Players</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
              {allPlayers.length}
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/50">
          {matches.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 opacity-50" />
              <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No completed matches yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-1">
                Start a session and click "Finish Game" on court to record matches here.
              </p>
            </div>
          ) : (
            matches.map((match, idx) => {
              const hasScore = Boolean(match.scores);
              return (
                <div key={match.id} className={idx > 0 ? 'pt-4' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Match #{match.matchNumber}
                      </span>
                      {hasScore && match.scores?.winner && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-lime-500/15 text-lime-600 dark:text-lime-400 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>{match.scores.winner} Won</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDuration(match.durationSeconds)}
                    </span>
                  </div>

                  {/* Teams & Scores Card */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/50">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      match.scores?.winner === 'Team A'
                        ? 'bg-emerald-500/15 border-emerald-500/30 font-bold'
                        : 'bg-emerald-500/5 dark:bg-emerald-950/30 border-emerald-500/10'
                    }`}>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          Team A
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {match.teamANames[0]} & {match.teamANames[1]}
                        </p>
                      </div>
                      {hasScore && (
                        <div className="text-lg font-black font-['Outfit'] text-emerald-600 dark:text-emerald-400">
                          {match.scores?.teamA}
                        </div>
                      )}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      match.scores?.winner === 'Team B'
                        ? 'bg-sky-500/15 border-sky-500/30 font-bold'
                        : 'bg-sky-500/5 dark:bg-sky-950/30 border-sky-500/10'
                    }`}>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider">
                          Team B
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {match.teamBNames[0]} & {match.teamBNames[1]}
                        </p>
                      </div>
                      {hasScore && (
                        <div className="text-lg font-black font-['Outfit'] text-sky-600 dark:text-sky-400">
                          {match.scores?.teamB}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Player Leaderboard */}
          {sortedPlayers.length > 0 && (
            <div className="pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Player Games Played
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sortedPlayers.map(p => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium truncate mr-1">{p.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200">
                      {p.gamesPlayed}g
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
