"use client";

import { useActionState } from "react";
import {
  applyToOpportunityAction,
  type ApplyResult,
} from "@/lib/actions/apply-to-opportunity";

const initialState: ApplyResult | null = null;

export default function ApplyOpportunityForm({
  locale,
  opportunityId,
  slug,
}: {
  locale: string;
  opportunityId: number;
  slug: string;
}) {
  const [state, formAction, isPending] = useActionState(
    applyToOpportunityAction,
    initialState
  );

  const isSuccess = state?.status === "success";
  const isWarning =
    state?.status === "already_applied" ||
    state?.status === "unauthorized" ||
    state?.status === "not_talent";
  const isError = state?.status === "error";

  return (
    <div className="mt-10">
      {state ? (
        <div
          className={`mb-6 rounded-2xl border p-4 ${
            isSuccess
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : isWarning
                ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                : isError
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-white/[0.03] text-white/60"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <form action={formAction}>
        <input type="hidden" name="opportunity_id" value={opportunityId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="slug" value={slug} />

        <button
          type="submit"
          disabled={isPending || isSuccess}
          className="rounded-full border border-[#c8a45d] px-8 py-4 text-sm uppercase tracking-[0.3em] text-[#c8a45d] transition hover:bg-[#c8a45d]/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? locale === "ar"
              ? "جاري التقديم..."
              : "Applying..."
            : isSuccess
              ? locale === "ar"
                ? "تم التقديم"
                : "Applied"
              : locale === "ar"
                ? "تقدم الآن"
                : "Apply Now"}
        </button>
      </form>
    </div>
  );
}