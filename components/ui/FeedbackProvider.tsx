"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type FeedbackTone = "success" | "error" | "warning" | "info";

type FeedbackInput = {
  title: string;
  description?: string;
  tone?: FeedbackTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type FeedbackToast = FeedbackInput & {
  id: string;
  tone: FeedbackTone;
  createdAt: number;
};

type FeedbackContextValue = {
  notify: (toast: FeedbackInput) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const DEFAULT_DURATION_MS = 4600;
const MAX_TOASTS = 4;

function makeToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeToast(toast: FeedbackInput): FeedbackToast {
  return {
    ...toast,
    id: makeToastId(),
    tone: toast.tone ?? "info",
    durationMs: toast.durationMs ?? DEFAULT_DURATION_MS,
    createdAt: Date.now(),
  };
}

function toneLabel(tone: FeedbackTone) {
  switch (tone) {
    case "success":
      return "تم";
    case "error":
      return "تنبيه";
    case "warning":
      return "مراجعة";
    case "info":
    default:
      return "معلومة";
  }
}

function toneClasses(tone: FeedbackTone) {
  switch (tone) {
    case "success":
      return "border-emerald-300/25 bg-emerald-950/35 text-emerald-50";
    case "error":
      return "border-red-300/25 bg-red-950/35 text-red-50";
    case "warning":
      return "border-amber-300/25 bg-amber-950/35 text-amber-50";
    case "info":
    default:
      return "border-white/12 bg-zinc-950/82 text-white";
  }
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<FeedbackToast[]>([]);
  const timersRef = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toastInput: FeedbackInput) => {
      const toast = normalizeToast(toastInput);

      setToasts((current) => [toast, ...current].slice(0, MAX_TOASTS));

      if (toast.durationMs && toast.durationMs > 0) {
        const timer = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
        timersRef.current.set(toast.id, timer);
      }

      return toast.id;
    },
    [dismiss],
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      notify,
      dismiss,
      success: (title, description) => notify({ title, description, tone: "success" }),
      error: (title, description) => notify({ title, description, tone: "error" }),
    }),
    [dismiss, notify],
  );

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<FeedbackInput>).detail;

      if (!detail?.title) {
        return;
      }

      notify(detail);
    }

    window.addEventListener("mlamh:toast", handleToast);

    return () => window.removeEventListener("mlamh:toast", handleToast);
  }, [notify]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[10060] mx-auto flex w-full max-w-md flex-col gap-3 px-4 sm:left-auto sm:right-5 sm:mx-0 sm:max-w-sm sm:px-0"
        role="status"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-3xl border p-4 shadow-2xl shadow-black/45 backdrop-blur-2xl ${toneClasses(
              toast.tone,
            )}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex min-w-12 justify-center rounded-full border border-current/15 px-2.5 py-1 text-[0.66rem] font-semibold text-current/75">
                {toneLabel(toast.tone)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-6">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs leading-5 text-current/68">{toast.description}</p>
                ) : null}
                {toast.actionLabel && toast.onAction ? (
                  <button
                    type="button"
                    className="mt-3 rounded-full border border-current/20 px-3 py-1.5 text-xs font-semibold text-current/86 transition hover:bg-white/10"
                    onClick={() => {
                      toast.onAction?.();
                      dismiss(toast.id);
                    }}
                  >
                    {toast.actionLabel}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-current/55 transition hover:bg-white/10 hover:text-current"
                aria-label="إغلاق التنبيه"
                onClick={() => dismiss(toast.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used inside FeedbackProvider");
  }

  return context;
}

export function showFeedback(toast: FeedbackInput) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("mlamh:toast", { detail: toast }));
}
