"use client";

import { useEffect, useState } from "react";

import {
  confirmOwnTalentDataConsentAction,
  getOwnTalentDataConsentAction,
} from "@/lib/actions/confirm-own-talent-data-consent";
import {
  getOwnTalentVisibilityAction,
  updateOwnTalentVisibilityAction,
  type TalentVisibility,
} from "@/lib/actions/update-own-talent-visibility";

export function TalentVisibilitySelectorV1({ locale }: { locale: "ar" | "en" }) {
  const isArabic = locale === "ar";
  const [visibility, setVisibility] = useState<TalentVisibility | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingConsent, setConfirmingConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [consentMessage, setConsentMessage] = useState("");

  useEffect(() => {
    let active = true;

    void Promise.all([
      getOwnTalentVisibilityAction(),
      getOwnTalentDataConsentAction(),
    ]).then(([visibilityValue, consentState]) => {
      if (!active) return;
      setVisibility(visibilityValue ?? "public");
      setConsentConfirmed(consentState?.confirmed === true);
    });

    return () => {
      active = false;
    };
  }, []);

  async function choose(next: TalentVisibility) {
    if (saving || next === visibility) return;
    const previous = visibility;
    setVisibility(next);
    setSaving(true);
    setMessage("");

    try {
      const result = await updateOwnTalentVisibilityAction(next, locale);
      setMessage(result.message);
      if (!result.success) setVisibility(previous);
    } finally {
      setSaving(false);
    }
  }

  async function confirmConsent() {
    if (confirmingConsent || consentConfirmed) return;

    setConfirmingConsent(true);
    setConsentMessage("");

    try {
      const result = await confirmOwnTalentDataConsentAction(locale);
      setConsentMessage(result.message);
      if (result.success) setConsentConfirmed(true);
    } finally {
      setConfirmingConsent(false);
    }
  }

  return (
    <section id="privacy" className="scroll-mt-36 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          {isArabic ? "الخصوصية والموافقة" : "PRIVACY & CONSENT"}
        </p>
        <span className="rounded-full border border-gold/25 bg-gold/[0.07] px-2.5 py-1 text-[10px] text-gold">
          ⭐ {isArabic ? "مطلوب للاعتماد" : "Required for approval"}
        </span>
      </div>

      <h2 className="mt-3 text-2xl font-light text-white">
        {isArabic ? "طريقة ظهور ملفك" : "Profile visibility"}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">
        {isArabic
          ? "يمكنك تغيير هذا الخيار في أي وقت. الملف الخاص لا يظهر في دليل المواهب العام، لكنه يبقى متاحًا للمطابقة الخاصة والـBriefs."
          : "You can change this at any time. Private profiles stay hidden from the public directory while remaining eligible for private matching and Briefs."}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={saving || visibility === null}
          onClick={() => void choose("public")}
          className={`rounded-2xl border p-4 text-start transition ${visibility === "public" ? "border-gold/45 bg-gold/[0.08]" : "border-white/10 bg-black/20 hover:border-gold/25"}`}
        >
          <span className="block text-sm font-medium text-white">
            {isArabic ? "ملف عام بعد الاعتماد" : "Public after approval"}
          </span>
          <span className="mt-1 block text-xs leading-6 text-white/45">
            {isArabic ? "يمكن أن يظهر في دليل المواهب العام بعد استيفاء شروط الاعتماد." : "Can appear in the public talent directory after approval requirements are met."}
          </span>
        </button>

        <button
          type="button"
          disabled={saving || visibility === null}
          onClick={() => void choose("private")}
          className={`rounded-2xl border p-4 text-start transition ${visibility === "private" ? "border-gold/45 bg-gold/[0.08]" : "border-white/10 bg-black/20 hover:border-gold/25"}`}
        >
          <span className="block text-sm font-medium text-white">
            {isArabic ? "ملف خاص" : "Private profile"}
          </span>
          <span className="mt-1 block text-xs leading-6 text-white/45">
            {isArabic ? "لا يظهر للعامة، ويظل مؤهلًا للمطابقة الخاصة والترشيحات الداخلية." : "Hidden from the public directory while remaining eligible for private matching."}
          </span>
        </button>
      </div>

      {message ? <p className="mt-4 text-xs leading-6 text-gold/80">{message}</p> : null}

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-white">
                {isArabic ? "تأكيد دقة البيانات والتواصل" : "Data accuracy and contact confirmation"}
              </h3>
              <span className="rounded-full border border-gold/20 bg-gold/[0.06] px-2.5 py-1 text-[10px] text-gold">
                ⭐ {isArabic ? "مطلوب" : "Required"}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-white/45">
              {isArabic
                ? "أؤكد أن بيانات ملفي صحيحة، وأوافق على أن تتواصل معي ملامح بخصوص الفرص والمطابقات المتعلقة بحسابي."
                : "I confirm that my profile information is accurate and agree that MLAMH may contact me about opportunities and matches related to my account."}
            </p>
          </div>

          {consentConfirmed ? (
            <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-4 py-2 text-xs text-emerald-300">
              ✓ {isArabic ? "تم التأكيد" : "Confirmed"}
            </span>
          ) : (
            <button
              type="button"
              disabled={confirmingConsent || consentConfirmed === null}
              onClick={() => void confirmConsent()}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/[0.08] px-5 text-sm text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirmingConsent
                ? isArabic ? "جارٍ الحفظ..." : "Saving..."
                : isArabic ? "أؤكد وأوافق" : "Confirm & agree"}
            </button>
          )}
        </div>

        {consentMessage ? (
          <p className="mt-3 text-xs leading-6 text-gold/80">{consentMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
