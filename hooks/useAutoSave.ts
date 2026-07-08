import { useEffect, useRef, useState } from "react";

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type AutoSaveOptions<T> = {
  delay?: number;
  enabled?: boolean;
  onSave: (data: T) => Promise<void>;
};

export function useAutoSave<T>(value: T, options: AutoSaveOptions<T>) {
  const { delay = 800, enabled = true, onSave } = options;

  const [status, setStatus] = useState<AutoSaveStatus>("idle");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSaveRef = useRef(0);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    setStatus("saving");

    const saveId = ++activeSaveRef.current;

    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(value);

        if (saveId !== activeSaveRef.current) return;

        setStatus("saved");

        resetTimeoutRef.current = setTimeout(() => {
          setStatus((current) => (current === "saved" ? "idle" : current));
        }, 1200);
      } catch (error) {
        console.error("AutoSave error:", error);

        if (saveId !== activeSaveRef.current) return;

        setStatus("error");
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [value, delay, enabled, onSave]);

  return { status };
}