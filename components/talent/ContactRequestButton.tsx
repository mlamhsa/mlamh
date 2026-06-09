"use client";

import { useState } from "react";
import { createContactRequestAction } from "@/lib/actions/contact-request-actions";

export default function ContactRequestButton({
  applicationId,
  opportunityId,
  publisherId,
  talentId,
  locale,
}: {
  applicationId: number;
  opportunityId: number;
  publisherId: number;
  talentId: number;
  locale: string;
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setStatus("pending");
    setError(null);
    try {
      await createContactRequestAction(
        applicationId,
        opportunityId,
        publisherId,
        talentId,
        locale
      );
      setStatus("sent");
    } catch (e: any) {
      setError(e.message ?? "Failed to send request.");
      setStatus("idle");
    }
  };

  return (
    <div className="mt-3">
      {status === "sent" ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-300 text-sm">
          {locale === "ar"
            ? "تم إرسال طلب التواصل للناشر."
            : "Contact request sent to publisher."}
        </div>
      ) : (
        <>
          <button
            onClick={handleClick}
            className="rounded-full border border-gold px-6 py-2 text-sm text-gold hover:bg-gold/10 transition"
          >
            {locale === "ar"
              ? "طلب التواصل مع الناشر"
              : "Request Contact with Publisher"}
          </button>
          {error && (
            <p className="mt-2 text-red-400 text-sm">{error}</p>
          )}
        </>
      )}
    </div>
  );
}