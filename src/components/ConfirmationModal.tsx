import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  let confirmBtnClass = 'bg-rose-600 hover:bg-rose-500 text-white';
  let Icon = Trash2;

  if (confirmVariant === 'warning') {
    confirmBtnClass = 'bg-amber-600 hover:bg-amber-500 text-white';
    Icon = AlertTriangle;
  } else if (confirmVariant === 'primary') {
    confirmBtnClass = 'bg-emerald-600 hover:bg-emerald-500 text-white';
    Icon = RotateCcw;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700 dark:bg-slate-900 dark:border-slate-700 bg-white border-slate-200 text-slate-900 dark:text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${confirmVariant === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-transform active:scale-95 ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
