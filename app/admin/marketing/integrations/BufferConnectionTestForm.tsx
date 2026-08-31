"use client";

import { useActionState } from "react";

import {
  testBufferConnectionAction,
  type BufferConnectionActionState,
} from "./actions";

const initialState: BufferConnectionActionState = { ok: null, message: null };

export function BufferConnectionTestForm({ isArabic }: { isArabic: boolean }) {
  const [state, action, pending] = useActionState(testBufferConnectionAction, initialState);

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? (isArabic ? "جارٍ اختبار Buffer…" : "Testing Buffer…")
            : (isArabic ? "اختبار اتصال Buffer" : "Test Buffer connection")}
        </button>
      </form>
      {state.message ? (
        <p
          role="status"
          aria-live="polite"
          className={`max-w-sm text-[11px] leading-5 ${state.ok ? "text-emerald-300" : "text-red-300"}`}
        >
          {state.ok
            ? (isArabic ? "تم الاتصال بـ Buffer بنجاح والتحقق من قنوات ملامح." : state.message)
            : state.message}
        </p>
      ) : null}
    </div>
  );
}
