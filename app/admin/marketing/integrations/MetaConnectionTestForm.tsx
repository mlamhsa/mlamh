"use client";

import { useActionState } from "react";
import { testMetaReadOnlyConnectionAction, type ConnectionActionState } from "./actions";

const initialState: ConnectionActionState = { ok: null, message: null };

export function MetaConnectionTestForm({ isArabic }: { isArabic: boolean }) {
  const [state, action, pending] = useActionState(testMetaReadOnlyConnectionAction, initialState);
  return (
    <form action={action} className="mt-4">
      <button disabled={pending} className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs text-white/70 disabled:opacity-50">
        {pending ? (isArabic ? "جارٍ الاختبار…" : "Testing…") : (isArabic ? "اختبار اتصال Meta — قراءة فقط" : "Test Meta connection — read only")}
      </button>
      {state.message ? <p className={`mt-2 text-[11px] ${state.ok ? "text-emerald-300" : "text-amber-200"}`}>{state.message}</p> : null}
    </form>
  );
}
