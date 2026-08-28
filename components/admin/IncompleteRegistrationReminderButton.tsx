"use client";

import { useState } from "react";

import { Mail } from "lucide-react";

import { sendIncompleteRegistrationReminderAction } from "@/lib/actions/send-incomplete-registration-reminder";

type Props = {
  userId: string;
  locale: "ar" | "en";
};

export function IncompleteRegistrationReminderButton({
  userId,
  locale,
}: Props) {
  const isArabic =
    locale === "ar";

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function handleSend() {
    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const result =
        await sendIncompleteRegistrationReminderAction(
          userId,
          locale,
        );

      setSuccess(result.success);
      setMessage(result.message);
    } catch (error) {
      console.error(
        "[IncompleteRegistrationReminderButton]",
        error,
      );

      setSuccess(false);

      setMessage(
        isArabic
          ? "حدث خطأ أثناء إرسال التذكير."
          : "An error occurred while sending the reminder.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleSend}
        disabled={loading || success}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 text-xs font-medium text-amber-100 transition hover:border-amber-400/30 hover:bg-amber-400/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mail className="h-4 w-4" />

        {loading
          ? isArabic
            ? "جارٍ الإرسال..."
            : "Sending..."
          : success
            ? isArabic
              ? "تم إرسال التذكير"
              : "Reminder sent"
            : isArabic
              ? "إرسال تذكير"
              : "Send reminder"}
      </button>

      {message ? (
        <p
          className={`mt-2 text-xs ${
            success
              ? "text-emerald-300"
              : "text-red-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}