"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { Check, X } from "lucide-react";

interface ToastData {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  leaving: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
            style={{
              background: t.type === "success"
                ? "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))"
                : t.type === "error"
                  ? "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))"
                  : "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(79,70,229,0.95))",
              color: "white",
              backdropFilter: "blur(12px)",
              animation: t.leaving ? "toastOut 0.3s ease-in forwards" : "toastIn 0.3s ease-out",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            }}
          >
            {t.type === "success" ? <Check size={16} /> : t.type === "error" ? <X size={16} /> : null}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
