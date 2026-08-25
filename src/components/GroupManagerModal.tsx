import React, { useState } from 'react';
import { Link, Unlink, X, Check, Plus, AlertCircle, Sparkles, Shield } from 'lucide-react';
import type { Player, PlayerGroup } from '../types';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Player[];
  allPlayers: Player[];
  groups: PlayerGroup[];
  onCreateGroup: (playerIds: string[], groupName?: string, groupType?: 'duo' | 'foursome') => boolean;
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
  const [groupType, setGroupType] = useState<'duo' | 'foursome'>('duo');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const maxAllowed = groupType === 'duo' ? 2 : 4;

  const togglePlayerSelection = (id: string) => {
    setError(null);
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(prev => prev.filter(pId => pId !== id));
    } else {
      if (selectedPlayerIds.length >= maxAllowed) {
        setError(`Maximum ${maxAllowed} players for a ${groupType === 'duo' ? 'Partner Duo' : '4-Player Match Group'}.`);
        return;
      }
      setSelectedPlayerIds(prev => [...prev, id]);
    }
  };

  const handleGroupTypeChange = (type: 'duo' | 'foursome') => {
    setGroupType(type);
    setError(null);
    const max = type === 'duo' ? 2 : 4;
    if (selectedPlayerIds.length > max) {
      setSelectedPlayerIds(prev => prev.slice(0, max));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const required = groupType === 'duo' ? 2 : 4;
    if (selectedPlayerIds.length !== required) {
      setError(`Please select exactly ${required} players for a ${groupType === 'duo' ? 'Partner Duo' : '4-Player Match Group (Never Split)'}.`);
      return;
    }
    const success = onCreateGroup(selectedPlayerIds, customGroupName, groupType);
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
                Link 2-player partner duos or 4-player match groups (Never Split)
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
                No active preset groups. Create a group below to link players together!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map(group => {
                  const members = allPlayers.filter(p => group.playerIds.includes(p.id));
                  const isFoursome = group.playerIds.length === 4;
                  return (
                    <div
                      key={group.id}
                      className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isFoursome ? (
                            <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          ) : (
                            <Link className="w-3.5 h-3.5 text-lime-500 flex-shrink-0" />
                          )}
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {group.name}
                          </h5>
                          {isFoursome && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Never Split
                            </span>
                          )}
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

          {/* Form: Create New Duo or 4-Player Foursome */}
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-lime-500" />
              <span>Create Linked Group</span>
            </h4>

            {/* Group Type Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                1. Choose Group Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleGroupTypeChange('duo')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                    groupType === 'duo'
                      ? 'bg-lime-500/15 border-lime-500 text-lime-700 dark:text-lime-300 ring-2 ring-lime-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Link className="w-3.5 h-3.5 text-lime-500" />
                    <span>2-Player Duo (Partners)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    2 players linked together as doubles partners.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGroupTypeChange('foursome')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                    groupType === 'foursome'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>4-Player Group (Never Split)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    4 players match together. Never split across matches.
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                2. Select {maxAllowed} Players ({selectedPlayerIds.length}/{maxAllowed} selected)
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
                          ? groupType === 'foursome'
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-bold'
                            : 'bg-lime-500/15 border-lime-500/50 text-lime-700 dark:text-lime-300 font-bold'
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
                3. Custom Group Name (Optional)
              </label>
              <input
                type="text"
                value={customGroupName}
                onChange={e => setCustomGroupName(e.target.value)}
                placeholder={groupType === 'duo' ? 'e.g. Duo: Alex & Jordan' : 'e.g. 4-Player Match: Group Thunder'}
                maxLength={35}
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
              disabled={selectedPlayerIds.length !== maxAllowed}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                groupType === 'foursome'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-lime-500 hover:bg-lime-400 text-slate-950'
              }`}
            >
              <Link className="w-4 h-4 stroke-[2.5]" />
              <span>Link {selectedPlayerIds.length} Players as {groupType === 'foursome' ? '4-Player Group (Never Split)' : 'Partner Duo'}</span>
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
