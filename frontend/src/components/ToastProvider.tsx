import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

type ToastInput = {
  title: string;
  message?: string;
  variant?: ToastVariant;
};

type ToastItem = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastIconByVariant(variant: ToastVariant) {
  if (variant === 'success') return '✓';
  if (variant === 'error') return '!';
  return 'i';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function removeToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast(input: ToastInput) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((current) => [
      ...current,
      {
        id,
        title: input.title,
        message: input.message,
        variant: input.variant ?? 'info'
      }
    ]);

    window.setTimeout(() => removeToast(id), 4200);
  }

  const value = useMemo(
    () => ({
      showToast
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-card--${toast.variant}`}>
            <div className="toast-card__icon" aria-hidden="true">
              {toastIconByVariant(toast.variant)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="toast-card__title">{toast.title}</p>
              {toast.message ? <p className="toast-card__message">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              className="toast-card__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Закрыть уведомление"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
