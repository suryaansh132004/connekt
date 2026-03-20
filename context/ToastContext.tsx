"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 pointer-events-none md:top-6 md:right-6">
        {toasts.map((t) => {
          let bgColor = "bg-white/10";
          let borderColor = "border-white/20";
          let icon = <Info size={16} className="text-[#4DEFFF]" />;

          if (t.type === "success") {
            bgColor = "bg-[#7CFF8A]/10";
            borderColor = "border-[#7CFF8A]/30";
            icon = <CheckCircle2 size={16} className="text-[#7CFF8A]" />;
          } else if (t.type === "error") {
             bgColor = "bg-[#FF5C8A]/10";
             borderColor = "border-[#FF5C8A]/30";
             icon = <AlertCircle size={16} className="text-[#FF5C8A]" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-right-8 duration-300 ${bgColor} ${borderColor}`}
            >
              {icon}
              <p className="text-sm font-medium text-white">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-2 text-white/50 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
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
