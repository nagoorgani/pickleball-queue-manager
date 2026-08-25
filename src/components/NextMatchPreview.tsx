import React from 'react';
import { Users2, Clock, UserCheck, Shield, Link } from 'lucide-react';
import type { Player, PlayerGroup } from '../types';
import { getNextFourForCourt } from '../utils/rotation';

interface NextMatchPreviewProps {
  queue: Player[];
  groups: PlayerGroup[];
  isCourt2Available: boolean;
}

export const NextMatchPreview: React.FC<NextMatchPreviewProps> = ({
  queue,
  groups,
  isCourt2Available,
}) => {
  const { fourPlayers } = getNextFourForCourt(queue, groups);
  const hasFourReady = Boolean(fourPlayers && fourPlayers.length === 4);

  const nextTeamA = hasFourReady && fourPlayers ? [fourPlayers[0], fourPlayers[1]] : [];
  const nextTeamB = hasFourReady && fourPlayers ? [fourPlayers[2], fourPlayers[3]] : [];

  const groupMap = new Map<string, PlayerGroup>();
  groups.forEach(g => groupMap.set(g.id, g));

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-slate-900 dark:text-white">
              Section 2: Next Match Preview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Next 4 players on deck according to rotation rules ({isCourt2Available ? '2-Court Shared Queue' : '1-Court Queue'})
            </p>
          </div>
        </div>

        {hasFourReady ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            On Deck Ready
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {queue.length}/4 Ready
          </span>
        )}
      </div>

      {hasFourReady ? (
        <div className="bg-slate-50 dark:bg-slate-950/70 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            {/* NEXT TEAM A */}
            <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3.5 border border-emerald-500/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Next Team A
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Position 1 & 2
                </span>
              </div>
              <div className="space-y-1.5">
                {nextTeamA.map((p, idx) => {
                  const group = p.groupId ? groupMap.get(p.groupId) : null;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          A{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {p.name}
                        </span>
                        {group && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-lime-500/15 text-lime-600 dark:text-lime-400 flex items-center gap-0.5 flex-shrink-0"
                            title={group.name}
                          >
                            {group.playerIds.length === 4 ? <Shield className="w-2.5 h-2.5" /> : <Link className="w-2.5 h-2.5" />}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                        {p.gamesPlayed}g
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NEXT TEAM B */}
            <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3.5 border border-sky-500/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                  Next Team B
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Position 3 & 4
                </span>
              </div>
              <div className="space-y-1.5">
                {nextTeamB.map((p, idx) => {
                  const group = p.groupId ? groupMap.get(p.groupId) : null;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          B{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {p.name}
                        </span>
                        {group && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-lime-500/15 text-lime-600 dark:text-lime-400 flex items-center gap-0.5 flex-shrink-0"
                            title={group.name}
                          >
                            {group.playerIds.length === 4 ? <Shield className="w-2.5 h-2.5" /> : <Link className="w-2.5 h-2.5" />}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                        {p.gamesPlayed}g
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-lime-500" />
            <span>These 4 players will take whichever court finishes next according to rotation rules.</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <Clock className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-70" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
            Waiting for more players.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {queue.length === 0
              ? 'No players waiting in the queue. New arrivals will appear here.'
              : `${queue.length} of 4 players ready. Need ${4 - queue.length} more player${
                  4 - queue.length === 1 ? '' : 's'
                } to preview the next 4-player match.`}
          </p>
        </div>
      )}
    </section>
  );
};
