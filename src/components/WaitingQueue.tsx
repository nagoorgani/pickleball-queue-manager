import React, { useState, useMemo } from 'react';
import {
  ListOrdered,
  Search,
  X,
  Edit2,
  Trash2,
  Clock,
  Trophy,
  Users,
} from 'lucide-react';
import type { Player } from '../types';

interface WaitingQueueProps {
  queue: Player[];
  onEditPlayer: (player: Player) => void;
  onRequestRemovePlayer: (player: Player) => void;
}

export const WaitingQueue: React.FC<WaitingQueueProps> = ({
  queue,
  onEditPlayer,
  onRequestRemovePlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQueueWithIndex = useMemo(() => {
    return queue
      .map((player, originalIndex) => ({ player, originalIndex }))
      .filter(({ player }) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
  }, [queue, searchQuery]);

  const formatWaitTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just joined';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-slate-900 dark:text-white">
                Section 3: Waiting Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {queue.length} Waiting
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Strict arrival order • Position preserved automatically
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {queue.length > 0 && (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search player in queue..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Waiting Queue is Empty
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-1">
            New players added will appear here in the exact order they arrive.
          </p>
        </div>
      ) : filteredQueueWithIndex.length === 0 ? (
        <div className="py-8 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">
          No waiting players matching "<span className="font-semibold">{searchQuery}</span>"
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredQueueWithIndex.map(({ player, originalIndex }) => {
            const queueNumber = originalIndex + 1;
            const isOnDeck = originalIndex < 4;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                  isOnDeck
                    ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-800/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left: Rank badge & Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isOnDeck
                        ? 'bg-sky-500 text-white shadow-sky-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {queueNumber}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {player.name}
                      </span>
                      {isOnDeck && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          Next Match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatWaitTime(player.joinedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditPlayer(player)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Edit player name"
                    aria-label={`Edit ${player.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestRemovePlayer(player)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Remove player"
                    aria-label={`Remove ${player.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
