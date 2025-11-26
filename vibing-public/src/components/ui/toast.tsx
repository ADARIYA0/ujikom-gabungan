'use client';

import * as React from 'react';
import { X, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from './utils';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastProps[];
  toast: (props: Omit<ToastProps, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      id,
      duration: 5000,
      ...props,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastProps[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 w-full sm:w-auto max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps & { onDismiss: () => void }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  React.useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const variants = {
    default: {
      container: 'bg-white border-gray-200 shadow-lg',
      icon: 'text-primary',
      title: 'text-gray-900',
      description: 'text-gray-600',
    },
    success: {
      container: 'bg-slate-50 border-slate-200 shadow-lg',
      icon: 'text-slate-600',
      title: 'text-slate-900',
      description: 'text-slate-700',
    },
    error: {
      container: 'bg-red-50 border-red-200 shadow-lg',
      icon: 'text-red-600',
      title: 'text-red-900',
      description: 'text-red-700',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 shadow-lg',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      description: 'text-yellow-700',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 shadow-lg',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      description: 'text-blue-700',
    },
  };

  const variantStyles = variants[variant];
  const Icon = {
    default: Info,
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }[variant];

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex items-start gap-3 rounded-lg border p-4 transition-all duration-300 ease-out',
        variantStyles.container,
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        isLeaving && 'translate-x-full opacity-0'
      )}
      role="alert"
    >
      <div className={cn('flex-shrink-0 mt-0.5', variantStyles.icon)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <div className={cn('font-semibold text-sm mb-1', variantStyles.title)}>
            {title}
          </div>
        )}
        {description && (
          <div className={cn('text-sm', variantStyles.description)}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className={cn(
          'flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/5',
          variantStyles.description
        )}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

