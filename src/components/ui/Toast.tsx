"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ message, title, variant }: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, title, variant }]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (variant: ToastVariant) => {
    switch (variant) {
      case "success": return <CheckCircle2 className="text-success h-5 w-5" />;
      case "error": return <XCircle className="text-destructive h-5 w-5" />;
      case "warning": return <AlertTriangle className="text-warning h-5 w-5" />;
    }
  };

  const getBgClass = (variant: ToastVariant) => {
    switch (variant) {
      case "success": return "bg-success/10 border-success/20 text-success";
      case "error": return "bg-destructive/10 border-destructive/20 text-destructive";
      case "warning": return "bg-warning/10 border-warning/20 text-warning";
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="pointer-events-none fixed top-0 z-100 flex w-full flex-col gap-2 p-4 sm:p-6 md:top-4 md:right-4 md:w-auto md:max-w-105">
        {toasts.map((t) => (
          <div 
            key={t.id}
            className={`pointer-events-auto flex w-full items-start gap-4 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-top-5 md:slide-in-from-right-5 fade-in duration-300 bg-surface ${getBgClass(t.variant)}`}
          >
            <div className="shrink-0 mt-0.5">{getIcon(t.variant)}</div>
            <div className="flex-1 overflow-hidden">
              {t.title && <h3 className="font-bold text-sm tracking-wide">{t.title}</h3>}
              <p className={`text-sm opacity-90 ${t.title ? "mt-1" : ""}`}>{t.message}</p>
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
