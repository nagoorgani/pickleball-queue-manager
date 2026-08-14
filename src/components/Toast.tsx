import React from 'react';
import type { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => {
        let Icon = Info;
        let bgClass = 'bg-slate-800 border-slate-700 text-slate-100';
        let iconColor = 'text-sky-400';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bgClass = 'bg-emerald-950/90 border-emerald-600/60 text-emerald-100';
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bgClass = 'bg-rose-950/90 border-rose-600/60 text-rose-100';
          iconColor = 'text-rose-400';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          bgClass = 'bg-amber-950/90 border-amber-600/60 text-amber-100';
          iconColor = 'text-amber-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up ${bgClass}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs opacity-90 mt-1 leading-relaxed break-words">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
