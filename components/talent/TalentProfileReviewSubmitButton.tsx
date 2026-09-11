"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { submitTalentProfileReviewAction } from "@/lib/actions/submit-talent-profile-review";

type Props = {
  locale: string;
  onSubmitted?: () => void | Promise<void>;
  label?: string;
  wrapperClassName?: string;
  buttonClassName?: string;
};

export default function TalentProfileReviewSubmitButton({
  locale,
  onSubmitted,
  label,
  wrapperClassName = "mt-6",
  buttonClassName = "inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold text-black transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50",
}: Props) {
  const isArabic = locale === "ar";
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (submitting) return;

    setSubmitting(true);
    setMessage("");
    setSuccess(false);

    try {
      const result = await submitTalentProfileReviewAction(locale);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        if (onSubmitted) await onSubmitted();
        router.refresh();
      }
    } catch (error) {
      console.error("[TalentProfileReviewSubmitButton]", error);
      setMessage(
        isArabic
          ? "تعذر إرسال الملف الآن. حاول مرة أخرى."
          : "Unable to submit your profile right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className={buttonClassName}
      >
        {submitting
          ? isArabic
            ? "جارٍ إرسال الملف..."
            : "Submitting profile..."
          : label ?? (isArabic ? "إرسال الملف للمراجعة" : "Submit profile for review")}
      </button>

      {message ? (
        <p role="status" className={`mt-3 text-sm ${success ? "text-emerald-300" : "text-red-300"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
