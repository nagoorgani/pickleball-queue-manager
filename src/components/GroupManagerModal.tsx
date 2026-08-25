import React, { useState } from 'react';
import { Link, Unlink, X, Check, Plus, AlertCircle, Sparkles } from 'lucide-react';
import type { Player, PlayerGroup } from '../types';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Player[];
  allPlayers: Player[];
  groups: PlayerGroup[];
  onCreateGroup: (playerIds: string[], groupName?: string) => boolean;
  onUnlinkGroup: (groupId: string) => void;
}

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  isOpen,
  onClose,
  allPlayers,
  groups,
  onCreateGroup,
  onUnlinkGroup,
}) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [customGroupName, setCustomGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePlayerSelection = (id: string) => {
    setError(null);
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(prev => prev.filter(pId => pId !== id));
    } else {
      if (selectedPlayerIds.length >= 4) {
        setError('Maximum 4 players per group.');
        return;
      }
      setSelectedPlayerIds(prev => [...prev, id]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayerIds.length < 2) {
      setError('Please select at least 2 players to form a preset group.');
      return;
    }
    const success = onCreateGroup(selectedPlayerIds, customGroupName);
    if (success) {
      setSelectedPlayerIds([]);
      setCustomGroupName('');
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-lime-500/10 text-lime-500">
              <Link className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Outfit']">Preset Player Groups</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Link doubles partners to move together in queue & rotations
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Preset Groups */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lime-500" />
              <span>Active Preset Groups ({groups.length})</span>
            </h4>

            {groups.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                No active preset groups. Create a group below to link partners together!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map(group => {
                  const members = allPlayers.filter(p => group.playerIds.includes(p.id));
                  return (
                    <div
                      key={group.id}
                      className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Link className="w-3.5 h-3.5 text-lime-500 flex-shrink-0" />
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {group.name}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {members.map(m => m.name).join(', ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUnlinkGroup(group.id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Unlink Group"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form: Create New Duo / Group */}
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-lime-500" />
              <span>Create Linked Partner Duo / Group</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                1. Select 2 to 4 Players to Link Together ({selectedPlayerIds.length}/4 selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {allPlayers.map(p => {
                  const isSelected = selectedPlayerIds.includes(p.id);
                  const isAlreadyGrouped = Boolean(p.groupId);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isAlreadyGrouped}
                      onClick={() => togglePlayerSelection(p.id)}
                      className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-lime-500/15 border-lime-500/50 text-lime-700 dark:text-lime-300 font-bold'
                          : isAlreadyGrouped
                          ? 'opacity-40 bg-slate-100 dark:bg-slate-800 border-transparent cursor-not-allowed text-slate-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-lime-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                2. Custom Group Name (Optional)
              </label>
              <input
                type="text"
                value={customGroupName}
                onChange={e => setCustomGroupName(e.target.value)}
                placeholder="e.g. Duo: Alex & Jordan"
                maxLength={30}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={selectedPlayerIds.length < 2}
              className="w-full py-3 px-4 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Link className="w-4 h-4 stroke-[2.5]" />
              <span>Link {selectedPlayerIds.length} Players as Preset Group</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
