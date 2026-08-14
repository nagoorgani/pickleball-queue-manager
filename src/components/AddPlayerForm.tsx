import React, { useState, useRef } from 'react';
import { UserPlus, Sparkles, AlertCircle } from 'lucide-react';

interface AddPlayerFormProps {
  onAddPlayer: (name: string) => boolean;
  onLoadDemoPlayers: () => void;
  showDemoButton: boolean;
}

export const AddPlayerForm: React.FC<AddPlayerFormProps> = ({
  onAddPlayer,
  onLoadDemoPlayers,
  showDemoButton,
}) => {
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError('Please enter a player name.');
      inputRef.current?.focus();
      return;
    }

    const success = onAddPlayer(trimmed);
    if (success) {
      setName('');
      setLocalError(null);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-lime-500/10 text-lime-500">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] tracking-tight text-slate-900 dark:text-white">
              Add New Player
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Players are strictly added to the end of the rotation queue
            </p>
          </div>
        </div>

        {showDemoButton && (
          <button
            type="button"
            onClick={onLoadDemoPlayers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Populate 8 demo players for testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-500" />
            <span>Load 8 Demo Players</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="Enter player name (e.g. Maria, John K.)..."
              maxLength={30}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 text-base shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-base shadow-md shadow-lime-500/10 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span>Add Player</span>
          </button>
        </div>

        {localError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium pt-1 px-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}
      </form>
    </div>
  );
};
