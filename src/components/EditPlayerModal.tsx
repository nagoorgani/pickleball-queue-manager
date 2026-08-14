import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, X } from 'lucide-react';
import type { Player } from '../types';

interface EditPlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onSave: (playerId: string, newName: string) => boolean;
  onClose: () => void;
}

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  player,
  isOpen,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty.');
      return;
    }
    const success = onSave(player.id, trimmed);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-500/10 text-lime-500">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Edit Player Name</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updating details for {player.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="edit-player-name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
            >
              Player Full Name or Nickname
            </label>
            <input
              id="edit-player-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. John Doe"
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 text-base"
            />
            {error && (
              <p className="text-xs text-rose-500 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-lime-500 hover:bg-lime-400 text-slate-950 shadow-md transition-transform active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
