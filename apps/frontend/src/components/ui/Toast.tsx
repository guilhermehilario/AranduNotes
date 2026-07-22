import React from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';
import { useToastStore, type Toast } from '../../store/toastStore';

const toastIcons: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertTriangle className="h-5 w-5 text-rose-500" />,
  info: <Info className="h-5 w-5 text-brand-500" />,
};

const toastStyles: Record<Toast['type'], string> = {
  success: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20',
  error: 'border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20',
  info: 'border-brand-200 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-950/20',
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useToastStore((s) => s.removeToast);

  const handleClose = () => {
    removeToast(toast.id);
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right-4 fade-in duration-300 transition-all duration-300 ${
        toastStyles[toast.type]
      }`}
    >
      {toastIcons[toast.type]}
      <p className="text-sm font-medium text-slate-800 dark:text-dark-100 flex-1">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={handleClose}
        className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-dark-200 transition-colors cursor-pointer flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
