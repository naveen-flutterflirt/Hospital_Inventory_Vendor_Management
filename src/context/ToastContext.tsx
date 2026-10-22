'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { 
  CheckCircle2, AlertCircle, Info, AlertTriangle, X, Check 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
  isAlertOnly?: boolean; // if true, only show "OK" button
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
  };
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  showAlert: (message: string, title?: string, type?: 'success' | 'danger' | 'warning' | 'info') => Promise<void>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { message: '' },
  });

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, type, message, title, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Intercept native browser alert & confirm to strictly guarantee zero native browser popups appear
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      const originalConfirm = window.confirm;
      
      window.alert = (message?: any) => {
        addToast('info', String(message ?? ''), 'Notification');
      };

      // Native window.confirm cannot block asynchronously, so we safely suppress it and notify user
      window.confirm = (message?: string) => {
        console.warn('Native window.confirm was suppressed. Use showConfirm() from useToast() for custom UI dialogs.');
        addToast('warning', String(message || 'Confirmation required'), 'Notice');
        return true;
      };

      return () => {
        window.alert = originalAlert;
        window.confirm = originalConfirm;
      };
    }
  }, [addToast]);

  const showConfirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback(async (
    message: string, 
    title = 'Notification', 
    type: 'success' | 'danger' | 'warning' | 'info' = 'info'
  ): Promise<void> => {
    await showConfirm({
      title,
      message,
      type,
      confirmText: 'OK',
      isAlertOnly: true,
    });
  }, [showConfirm]);

  const handleDialogConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  const handleDialogCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  // Handle keyboard events (Escape to cancel, Enter to confirm)
  useEffect(() => {
    if (!dialogState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDialogCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDialogConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState.isOpen, handleDialogCancel, handleDialogConfirm]);

  const toastMethods = {
    success: (msg: string, title?: string, duration?: number) => addToast('success', msg, title, duration),
    error: (msg: string, title?: string, duration?: number) => addToast('error', msg, title, duration),
    info: (msg: string, title?: string, duration?: number) => addToast('info', msg, title, duration),
    warning: (msg: string, title?: string, duration?: number) => addToast('warning', msg, title, duration),
  };

  const renderIcon = (type: ToastType, size = 18) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={size} className="text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle size={size} className="text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={size} className="text-amber-600 shrink-0" />;
      case 'info':
      default:
        return <Info size={size} className="text-[#127670] shrink-0" />;
    }
  };

  const renderDialogIcon = (type: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 size={26} strokeWidth={2.5} />
          </div>
        );
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertCircle size={26} strokeWidth={2.5} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <AlertTriangle size={26} strokeWidth={2.5} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#127670] flex items-center justify-center shrink-0 border border-teal-100">
            <Info size={26} strokeWidth={2.5} />
          </div>
        );
    }
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, showConfirm, showAlert }}>
      {children}

      {/* Floating Toast Notification Stack */}
      <div 
        aria-live="polite"
        className="fixed top-4 sm:top-6 left-3 right-3 sm:left-auto sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-full sm:max-w-md pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "p-3.5 sm:p-4 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md pointer-events-auto animate-in slide-in-from-top-3 duration-250 transition-all",
              t.type === 'success' && "bg-emerald-50/95 text-emerald-950 border-emerald-200/80 shadow-emerald-900/10",
              t.type === 'error' && "bg-rose-50/95 text-rose-950 border-rose-200/80 shadow-rose-900/10",
              t.type === 'warning' && "bg-amber-50/95 text-amber-950 border-amber-200/80 shadow-amber-900/10",
              t.type === 'info' && "bg-teal-50/95 text-teal-950 border-teal-200/80 shadow-teal-900/10"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {renderIcon(t.type, 20)}
              <div className="min-w-0 flex-1">
                {t.title && (
                  <p className="font-bold text-xs text-slate-900 mb-0.5 leading-tight">{t.title}</p>
                )}
                <p className="font-medium text-xs break-words leading-tight text-slate-700">{t.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
              title="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Custom Confirmation / Alert Dialog Modal */}
      {dialogState.isOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleDialogCancel}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm sm:max-w-md w-full p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {renderDialogIcon(dialogState.options.type)}
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {dialogState.options.title || (dialogState.options.isAlertOnly ? 'Notice' : 'Confirmation')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed break-words">
                  {dialogState.options.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-2">
              {!dialogState.options.isAlertOnly && (
                <button
                  type="button"
                  onClick={handleDialogCancel}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  {dialogState.options.cancelText || 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={handleDialogConfirm}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5",
                  dialogState.options.type === 'danger'
                    ? "bg-rose-600 hover:bg-rose-700"
                    : dialogState.options.type === 'warning'
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-[#125F5C] hover:bg-[#0c4240]"
                )}
              >
                {dialogState.options.isAlertOnly ? (
                  <span>{dialogState.options.confirmText || 'OK'}</span>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    <span>{dialogState.options.confirmText || 'Confirm'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
