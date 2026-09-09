"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getOwnPendingTalentProfileChangeAction,
  getOwnTalentProfileAction,
} from "@/lib/actions/update-own-talent-profile";
import { submitTalentProfileReviewAction } from "@/lib/actions/submit-talent-profile-review";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

type Props = {
  locale: "ar" | "en";
};

type TalentSnapshot = Awaited<ReturnType<typeof getOwnTalentProfileAction>>;
type PendingSnapshot = Awaited<ReturnType<typeof getOwnPendingTalentProfileChangeAction>>;

function requirementHref(key: string) {
  if (key === "primary_role") return "#specialization";
  if (key === "country") return "#identity";
  if (key === "profile_visibility" || key === "data_accuracy_contact_consent") return "#privacy";
  return "#identity";
}

export function TalentProfileApprovalReadinessV1({ locale }: Props) {
  const isArabic = locale === "ar";
  const [talent, setTalent] = useState<TalentSnapshot>(null);
  const [pending, setPending] = useState<PendingSnapshot>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextTalent, nextPending] = await Promise.all([
        getOwnTalentProfileAction(locale),
        getOwnPendingTalentProfileChangeAction(locale),
      ]);
      setTalent(nextTalent);
      setPending(nextPending);
    } catch (error) {
      console.error("[TalentProfileApprovalReadinessV1.refresh]", error);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void refresh();

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => void refresh(), 1800);
    };

    document.addEventListener("input", scheduleRefresh, true);
    document.addEventListener("change", scheduleRefresh, true);

    return () => {
      document.removeEventListener("input", scheduleRefresh, true);
      document.removeEventListener("change", scheduleRefresh, true);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [refresh]);

  const readiness = useMemo(() => {
    if (!talent) return null;

    return getTalentProfileReadiness({
      ...talent,
      name_ar: pending?.requested_name_ar?.trim() || talent.name_ar,
      name_en: pending?.requested_name_en?.trim() || talent.name_en,
      phone: pending?.requested_phone?.trim() || talent.phone,
      nationality_slug:
        pending?.requested_nationality_slug?.trim() || talent.nationality_slug,
    });
  }, [pending, talent]);

  const approvalStatus = String(talent?.approval_status ?? "not_submitted");
  const isPendingReview = approvalStatus === "pending" || approvalStatus === "submitted";
  const isApproved = approvalStatus === "approved";
  const isChangesRequested = approvalStatus === "changes_requested";
  const missing = readiness?.missingRequirements ?? [];

  const submit = useCallback(async () => {
    if (!readiness?.isReady || submitting || approvalStatus !== "not_submitted") return;

    setSubmitting(true);
    setMessage("");
    try {
      const result = await submitTalentProfileReviewAction(locale);
      setMessage(result.message);
      if (result.success) {
        await refresh();
      }
    } catch (error) {
      console.error("[TalentProfileApprovalReadinessV1.submit]", error);
      setMessage(
        isArabic
          ? "تعذر إرسال الملف للمراجعة. حاول مرة أخرى."
          : "Unable to submit the profile for review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [approvalStatus, isArabic, locale, readiness?.isReady, refresh, submitting]);

  if (loading) {
    return (
      <section className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-8 w-64 max-w-full animate-pulse rounded bg-white/10" />
      </section>
    );
  }

  if (!talent || !readiness) return null;

  const tone = isApproved
    ? "border-emerald-400/20 bg-emerald-400/[0.05]"
    : isPendingReview
      ? "border-gold/20 bg-gold/[0.05]"
      : isChangesRequested
        ? "border-orange-400/20 bg-orange-400/[0.05]"
        : readiness.isReady
          ? "border-gold/25 bg-gold/[0.045]"
          : "border-amber-400/20 bg-amber-400/[0.045]";

  const badge = isApproved
    ? isArabic ? "معتمد" : "Approved"
    : isPendingReview
      ? isArabic ? "قيد المراجعة" : "Under review"
      : isChangesRequested
        ? isArabic ? "مطلوب تعديل" : "Changes required"
        : readiness.isReady
          ? isArabic ? "جاهز للإرسال" : "Ready to submit"
          : isArabic ? `${missing.length} متطلبات ناقصة` : `${missing.length} requirements missing`;

  const title = isApproved
    ? isArabic ? "ملفك معتمد" : "Your profile is approved"
    : isPendingReview
      ? isArabic ? "ملفك قيد المراجعة" : "Your profile is under review"
      : isChangesRequested
        ? isArabic ? "أكمل التعديلات المطلوبة" : "Complete the requested changes"
        : readiness.isReady
          ? isArabic ? "ملفك جاهز للمراجعة" : "Your profile is ready for review"
          : isArabic ? "أكمل متطلبات الاعتماد" : "Complete the approval requirements";

  return (
    <section className={`mb-6 rounded-[1.75rem] border p-5 sm:p-6 ${tone}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/65">
            {badge}
          </span>

          <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-gold">
            {isArabic ? "جاهزية الاعتماد" : "APPROVAL READINESS"}
          </p>
          <h2 className="mt-2 text-2xl font-light text-white">{title}</h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
            {isApproved
              ? isArabic
                ? "استوفيت متطلبات الاعتماد ويمكنك التقديم على الفرص. البيانات الاختيارية تظل مفيدة لرفع قوة الملف وجودة الترشيح."
                : "You meet the approval requirements and can apply to opportunities. Optional details still help strengthen matching quality."
              : isPendingReview
                ? isArabic
                  ? "تم استلام ملفك للمراجعة. يمكنك الاستمرار في تحسين البيانات الاختيارية أثناء انتظار القرار."
                  : "Your profile is under review. You can keep improving optional details while waiting for the decision."
                : isChangesRequested
                  ? isArabic
                    ? "راجع ملاحظات فريق ملامح في أعلى الصفحة وأكمل التعديلات، ثم أعد إرسال الملف للمراجعة."
                    : "Review the MLAMH feedback at the top of the page, complete the changes, then resubmit."
                  : readiness.isReady
                    ? isArabic
                      ? "أكملت الحقول المطلوبة. لا تحتاج لرفع نسبة قوة الملف إلى رقم معين حتى ترسل الملف للمراجعة."
                      : "You completed the required fields. You do not need to reach an arbitrary profile-strength percentage before submitting."
                    : isArabic
                      ? "النجمة ⭐ تعني أن الحقل مطلوب للاعتماد. النبذة والمهارات واللغات والخبرة ومعرض الأعمال لا تمنع الإرسال للمراجعة."
                      : "A ⭐ marks information required for approval. Bio, skills, languages, experience and portfolio do not block review submission."}
          </p>

          {!readiness.isReady && missing.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {missing.map((requirement) => (
                <a
                  key={requirement.key}
                  href={requirementHref(requirement.key)}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 text-xs text-amber-100 transition hover:border-gold/45 hover:text-gold"
                >
                  <span>⭐ {isArabic ? requirement.ar : requirement.en}</span>
                  <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
                </a>
              ))}
            </div>
          ) : null}

          {message ? <p className="mt-4 text-sm text-gold">{message}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:min-w-48">
          {readiness.isReady && approvalStatus === "not_submitted" ? (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting
                ? isArabic ? "جارٍ الإرسال..." : "Submitting..."
                : isArabic ? "إرسال الملف للمراجعة" : "Submit for review"}
            </button>
          ) : null}

          <Link
            href={`/${locale}/talent-dashboard`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm text-white/65 transition hover:border-gold/35 hover:text-gold"
          >
            {isArabic ? "العودة للوحة الموهبة" : "Back to Talent Dashboard"}
          </Link>
        </div>
      </div>
    </section>
  );
}
