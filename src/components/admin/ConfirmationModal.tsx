import React from 'react';
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bgIcon: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      btnConfirm: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
    },
    warning: {
      bgIcon: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      btnConfirm: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
    },
    info: {
      bgIcon: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      btnConfirm: 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border ${style.bgIcon} shrink-0`}>
            {variant === 'danger' ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display text-white">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer ${style.btnConfirm}`}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
