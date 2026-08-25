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
  Link,
  GripVertical,
  Unlink,
  Sparkles,
} from 'lucide-react';
import type { Player, PlayerGroup, DragItemData } from '../types';

interface WaitingQueueProps {
  queue: Player[];
  groups: PlayerGroup[];
  onEditPlayer: (player: Player) => void;
  onRequestRemovePlayer: (player: Player) => void;
  onUnlinkGroup: (groupId: string) => void;
  onOpenGroupManager: () => void;
  onReorderQueue: (draggedPlayerId: string, targetIndex: number) => void;
  onDropOnQueue?: (dragData: DragItemData, targetIndex: number) => void;
}

export const WaitingQueue: React.FC<WaitingQueueProps> = ({
  queue,
  groups,
  onEditPlayer,
  onRequestRemovePlayer,
  onUnlinkGroup,
  onOpenGroupManager,
  onReorderQueue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const groupMap = useMemo(() => {
    const map = new Map<string, PlayerGroup>();
    groups.forEach(g => map.set(g.id, g));
    return map;
  }, [groups]);

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

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, player: Player, originalIndex: number) => {
    setDraggedPlayerId(player.id);
    let playerIds = [player.id];
    if (player.groupId) {
      const group = groupMap.get(player.groupId);
      if (group) playerIds = group.playerIds;
    }

    const dragData: DragItemData = {
      type: player.groupId ? 'group' : 'player',
      id: player.groupId || player.id,
      playerIds,
      source: 'queue',
      queueIndex: originalIndex,
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (!draggedPlayerId) return;

    onReorderQueue(draggedPlayerId, targetIndex);
    setDraggedPlayerId(null);
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header with Search & Group Manager Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drag handles (⋮⋮) to reorder • Preset partner teams stay together
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenGroupManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 text-lime-600 dark:text-lime-400 border border-lime-500/25 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Create or manage preset partner teams"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Preset Teams ({groups.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {queue.length > 0 && (
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search player or preset team in queue..."
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

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Waiting Queue is Empty
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-1">
            New players and finished match players automatically return here.
          </p>
        </div>
      ) : filteredQueueWithIndex.length === 0 ? (
        <div className="py-8 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">
          No waiting players matching "<span className="font-semibold">{searchQuery}</span>"
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueueWithIndex.map(({ player, originalIndex }, idx) => {
            const queueNumber = originalIndex + 1;
            const isOnDeck = originalIndex < 4;
            const group = player.groupId ? groupMap.get(player.groupId) : null;
            const isTargetDrop = dragOverIndex === originalIndex;

            // Check if this item is the FIRST member of a preset group in the list
            const prevItem = idx > 0 ? filteredQueueWithIndex[idx - 1] : null;
            const isFirstInGroup = group && (!prevItem || prevItem.player.groupId !== player.groupId);

            return (
              <div key={player.id} className="space-y-1">
                {/* PRESET TEAM HEADER CARD (if first member in group) */}
                {isFirstInGroup && group && (
                  <div
                    className="p-2 px-3 rounded-t-2xl bg-slate-100 dark:bg-slate-950 border border-b-0 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-sm"
                    style={{ borderTopColor: group.color, borderTopWidth: '3px' }}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {group.playerIds.length === 4 ? '🛡️ 4-Player Match Group' : 'Preset Team'}: {group.name}
                      </span>
                      {group.playerIds.length === 4 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Never Split
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onUnlinkGroup(group.id)}
                      className="text-[10px] font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
                      title="Unlink Group"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Unlink</span>
                    </button>
                  </div>
                )}

                {/* PLAYER ROW CARD */}
                <div
                  draggable
                  onDragStart={e => handleDragStart(e, player, originalIndex)}
                  onDragOver={e => handleDragOver(e, originalIndex)}
                  onDrop={e => handleDrop(e, originalIndex)}
                  onDragEnd={() => {
                    setDraggedPlayerId(null);
                    setDragOverIndex(null);
                  }}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                    isTargetDrop
                      ? 'border-lime-500 bg-lime-500/10 ring-2 ring-lime-500/40 scale-[1.01]'
                      : group
                      ? isFirstInGroup
                        ? 'rounded-t-none border-t-0 bg-slate-50 dark:bg-slate-950/90 border-slate-200 dark:border-slate-800'
                        : 'bg-slate-50 dark:bg-slate-950/90 border-slate-200 dark:border-slate-800'
                      : isOnDeck
                      ? 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-800/40'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                  }`}
                  style={
                    group
                      ? { borderLeftColor: group.color, borderLeftWidth: '4px' }
                      : undefined
                  }
                >
                  {/* Left: Drag handle, Rank badge & Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isOnDeck
                          ? 'bg-sky-500 text-white shadow-sky-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {queueNumber}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {player.name}
                        </span>

                        {group && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-lime-500/15 text-lime-600 dark:text-lime-400 border border-lime-500/20 flex items-center gap-1">
                            <Link className="w-2.5 h-2.5" />
                            <span>Linked Partner</span>
                          </span>
                        )}

                        {!group && isOnDeck && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            Next Match
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title="Edit player name"
                      aria-label={`Edit ${player.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRequestRemovePlayer(player)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Remove player"
                      aria-label={`Remove ${player.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
