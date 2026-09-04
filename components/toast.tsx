"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};
type ToastItem = ToastInput & { id: number; variant: ToastVariant };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback(
    (id: number) =>
      setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  );
  const showToast = useCallback(
    (input: ToastInput) => {
      const id = ++nextId.current;
      setToasts((current) => [
        ...current.slice(-3),
        { ...input, id, variant: input.variant ?? "info" },
      ]);
      window.setTimeout(() => dismiss(id), input.duration ?? 3500);
    },
    [dismiss],
  );
  const value = useMemo(() => showToast, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(calc(100vw-2rem),380px)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.variant === "success"
              ? CheckCircle2
              : toast.variant === "error"
                ? XCircle
                : Info;
          return (
            <div
              key={toast.id}
              role={toast.variant === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-sm border bg-card p-3 shadow-xl",
                toast.variant === "success" && "border-[#91aa6b]",
                toast.variant === "error" && "border-destructive/55",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  toast.variant === "success"
                    ? "text-[#5f793f]"
                    : toast.variant === "error"
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              />
              <div className="min-w-0 flex-1">
                <strong className="block text-xs">{toast.title}</strong>
                {toast.description && (
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="grid size-6 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Đóng thông báo"
              >
                <X className="size-3.5" />
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
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
