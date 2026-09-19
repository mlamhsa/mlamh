"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentProfileVisibilityAction } from "@/lib/actions/update-own-talent-profile-visibility";
import { PROFILE_VISIBILITY_OPTIONS } from "@/lib/data/talent-signup";
import { isValidLocale, type Locale } from "@/lib/i18n";

type TalentRecord = Record<string, unknown> & {
  profile_visibility?: string | null;
  approval_status?: string | null;
  modeling_types?: unknown;
};

const PARTS_MODEL_TYPES = new Set(["hand", "foot", "legs", "hair", "eyes", "smile"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function listValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }
  const raw = clean(value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
      : [];
  } catch {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

export default function TalentProfilePrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = use(params);
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const isArabic = locale === "ar";

  const [visibility, setVisibility] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [modelingTypes, setModelingTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const talent = (await getOwnTalentProfileAction(locale)) as TalentRecord | null;
        if (!talent) throw new Error();
        if (cancelled) return;
        setVisibility(clean(talent.profile_visibility).toLowerCase());
        setApprovalStatus(clean(talent.approval_status).toLowerCase());
        setModelingTypes(listValues(talent.modeling_types).map((value) => value.toLowerCase()));
      } catch {
        if (!cancelled) {
          setMessage(isArabic ? "تعذر تحميل إعدادات الخصوصية." : "Unable to load privacy settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isArabic, locale]);

  const hasPartsSpecialization = modelingTypes.some((value) => PARTS_MODEL_TYPES.has(value));

  async function save() {
    if (saving || !visibility) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("profile_visibility", visibility);
    const result = await updateOwnTalentProfileVisibilityAction(formData);
    setSuccess(result.success);
    setMessage(result.message);
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-32 text-white sm:px-6 sm:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              {isArabic ? "ملفي" : "MY PROFILE"}
            </p>
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">
              {isArabic ? "الخصوصية وظهور الملف" : "Privacy & profile visibility"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
              {isArabic
                ? "تحكم في ظهور ملفك العام من هنا. هذا الإعداد مستقل عن حالة المراجعة أو الاعتماد ولا يغيّر بيانات هويتك الأساسية."
                : "Control your public profile visibility here. This setting is independent from review or approval and does not change your core identity details."}
            </p>
          </div>
          <Link
            href={`/${locale}/talent-dashboard/profile`}
            className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:border-gold/30 hover:text-gold"
          >
            {isArabic ? "ملفي" : "Profile"}
          </Link>
        </div>

        {approvalStatus ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs leading-6 text-white/45">
            {isArabic
              ? "يمكنك تغيير ظهور الملف حتى لو كان ملفك معتمدًا أو قيد المراجعة؛ حالة المراجعة نفسها لن تتغير."
              : "You can change visibility even when your profile is approved or under review; the review status itself will not change."}
          </div>
        ) : null}

        {hasPartsSpecialization ? (
          <div className="mb-4 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-4 text-sm leading-7 text-white/75">
            <strong className="block text-gold">
              {isArabic ? "خصوصية مناسبة لهذا التخصص" : "Recommended privacy for this specialization"}
            </strong>
            <span className="mt-1 block">
              {isArabic
                ? "إذا كان عملك يركز على تصوير اليد أو القدم أو الشعر أو أجزاء محددة، نوصي بالملف الخاص. لن يظهر ملفك للعامة، وسيبقى مؤهلًا للمطابقة مع الفرص المناسبة داخل ملامح. القرار لك ولن نغيّر إعدادك تلقائيًا."
                : "If your work focuses on hands, feet, hair or other specific parts, we recommend a private profile. It stays hidden from the public while remaining eligible for relevant matching inside MLAMH. We will not change your setting automatically."}
            </span>
            {visibility !== "private" ? (
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className="mt-3 rounded-full border border-gold/35 px-4 py-2 text-xs text-gold hover:bg-gold/[0.08]"
              >
                {isArabic ? "اختيار ملف خاص" : "Choose private profile"}
              </button>
            ) : null}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 rounded-2xl bg-white/[0.035]" />
              <div className="h-24 rounded-2xl bg-white/[0.035]" />
            </div>
          ) : (
            <div className="grid gap-3">
              {PROFILE_VISIBILITY_OPTIONS.map((option) => {
                const selected = visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={`rounded-2xl border p-5 text-start transition ${selected ? "border-gold/60 bg-gold/[0.08]" : "border-white/10 bg-black/20 hover:border-white/20"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="block text-base font-semibold text-white">
                          {isArabic ? option.ar : option.en}
                        </span>
                        <span className="mt-2 block text-xs leading-6 text-white/45">
                          {isArabic ? option.descriptionAr : option.descriptionEn}
                        </span>
                      </div>
                      <span className={`mt-1 h-5 w-5 shrink-0 rounded-full border ${selected ? "border-gold bg-gold" : "border-white/20"}`} aria-hidden="true" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !visibility ? (
            <p className="mt-4 text-xs leading-6 text-amber-100/80">
              {isArabic ? "لم يتم تحديد إعداد ظهور لهذا الملف بعد. اختر عام أو خاص ثم احفظ الإعداد." : "No visibility setting has been selected for this profile yet. Choose Public or Private, then save."}
            </p>
          ) : null}

          {message ? (
            <div className={`mt-5 rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving || !visibility}
            className="mt-6 min-h-12 w-full rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ إعداد الظهور" : "Save visibility")}
          </button>
        </section>
      </div>
    </main>
  );
}
