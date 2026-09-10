"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { updateOwnTalentConsentAction } from "@/lib/actions/update-own-talent-consent";
import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import type { Locale } from "@/lib/i18n";

type TalentProfileSnapshot = {
  approval_status?: string | null;
  data_accuracy_contact_consent?: boolean | null;
};

type Props = {
  locale: Locale;
};

export default function TalentConsentCompletionCard({ locale }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isArabic = locale === "ar";
  const profilePath = `/${locale}/talent-dashboard/profile`;
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (pathname !== profilePath) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const profile = (await getOwnTalentProfileAction(locale)) as TalentProfileSnapshot | null;
        if (cancelled || !profile) return;
        const status = String(profile.approval_status ?? "not_submitted").trim().toLowerCase();
        const canComplete = ["not_submitted", "changes_requested", "rejected"].includes(status);
        setVisible(canComplete && profile.data_accuracy_contact_consent !== true);
      } catch {
        setVisible(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, pathname, profilePath]);

  useEffect(() => {
    function handleRequirementClick(event: MouseEvent) {
      if (!visible || pathname !== profilePath) return;
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      const text = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const isConsent = text.includes("الموافقة على دقة البيانات والتواصل") || text.includes("data accuracy and contact");
      if (!isConsent) return;

      event.preventDefault();
      event.stopPropagation();
      document.getElementById("talent-consent")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    document.addEventListener("click", handleRequirementClick, true);
    return () => document.removeEventListener("click", handleRequirementClick, true);
  }, [pathname, profilePath, visible]);

  if (!visible) return null;

  async function confirmConsent() {
    if (!checked || saving) return;
    setSaving(true);
    setMessage("");
    const result = await updateOwnTalentConsentAction(isArabic ? "ar" : "en");
    setMessage(result.message);
    if (result.success) {
      setVisible(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div
      id="talent-consent"
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full scroll-mt-36 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-gold/20 bg-gold/[0.035] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gold/80">
              {isArabic ? "خطوة مطلوبة للاعتماد" : "Required for approval"}
            </p>
            <h2 className="mt-1 text-xl font-light text-white">
              {isArabic ? "تأكيد دقة البيانات والتواصل" : "Confirm data accuracy and communication"}
            </h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#c9a962]"
              />
              <span className="text-sm leading-7 text-white/65">
                {isArabic
                  ? "أؤكد أن البيانات المدخلة صحيحة، وأوافق على أن تتواصل معي ملامح بخصوص الحساب والفرص ذات الصلة."
                  : "I confirm that the information I entered is accurate and agree that MLAMH may contact me about my account and relevant opportunities."}
              </span>
            </label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void confirmConsent()}
                disabled={!checked || saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-6 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={17} aria-hidden="true" />
                {saving
                  ? isArabic
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isArabic
                    ? "تأكيد والمتابعة"
                    : "Confirm and continue"}
              </button>
              {message ? <p className="text-xs text-white/55">{message}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
