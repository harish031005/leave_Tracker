/**
 * Toast notification system — shows success/error/info messages.
 *
 * Usage (from any component):
 *   import { useToast } from './Toast';
 *   const { showToast } = useToast();
 *   showToast('Leave request submitted!', 'success');
 *   showToast('Cannot approve your own leave', 'error');
 *
 * Toasts auto-dismiss after 3 seconds and slide in from the top-right.
 */

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed top-right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto animate-slide-in
              flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-soft-lg
              backdrop-blur-sm border cursor-pointer
              transition-all duration-300 hover:scale-[1.02]
              ${toast.type === 'success'
                ? 'bg-emerald/10 border-emerald/20 text-emerald-dark dark:text-emerald-light'
                : toast.type === 'error'
                  ? 'bg-rose/10 border-rose/20 text-rose-dark dark:text-rose-light'
                  : 'bg-indigo/10 border-indigo/20 text-indigo-dark dark:text-indigo-light'
              }
            `}
            onClick={() => removeToast(toast.id)}
          >
            {/* Icon */}
            <span className="text-lg">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
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
