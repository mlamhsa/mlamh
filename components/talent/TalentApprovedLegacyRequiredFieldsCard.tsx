"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateApprovedLegacyTalentRequiredFieldsAction } from "@/lib/actions/update-approved-legacy-talent-required-fields";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS } from "@/lib/data/talent-signup";

type TalentSnapshot = {
  approval_status?: string | null;
  phone?: string | null;
  primary_role?: string | null;
  category_slug?: string | null;
  gender?: string | null;
  nationality?: string | null;
  nationality_slug?: string | null;
  date_of_birth?: string | null;
  data_accuracy_contact_consent?: boolean | null;
};

type Props = {
  locale: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default function TalentApprovedLegacyRequiredFieldsCard({ locale }: Props) {
  const pathname = usePathname();
  const profileLocale: "ar" | "en" = locale === "en" ? "en" : "ar";
  const isArabic = profileLocale === "ar";
  const profilePath = `/${profileLocale}/talent-dashboard/profile`;

  const [snapshot, setSnapshot] = useState<TalentSnapshot | null>(null);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pathname !== profilePath) {
      setSnapshot(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const profile = (await getOwnTalentProfileAction(profileLocale)) as TalentSnapshot | null;
        if (!cancelled) setSnapshot(profile);
      } catch {
        if (!cancelled) setSnapshot(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, profileLocale, profilePath]);

  const missingFields = useMemo(() => {
    if (!snapshot) return [] as string[];
    const status = clean(snapshot.approval_status).toLowerCase();
    if (status !== "approved") return [] as string[];

    const missing: string[] = [];
    if (!clean(snapshot.phone)) missing.push("phone");
    if (!clean(snapshot.primary_role) && !clean(snapshot.category_slug)) missing.push("primary_role");
    if (!clean(snapshot.gender)) missing.push("gender");
    if (!clean(snapshot.nationality_slug) && !clean(snapshot.nationality)) missing.push("nationality");
    if (!clean(snapshot.date_of_birth)) missing.push("date_of_birth");
    return missing;
  }, [snapshot]);

  if (!snapshot || missingFields.length === 0 || pathname !== profilePath) return null;

  const consentAlsoMissing = snapshot.data_accuracy_contact_consent !== true;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage("");
    setSuccess(false);

    const payload = new FormData();
    payload.set("locale", profileLocale);
    if (missingFields.includes("phone")) payload.set("phone", phone);
    if (missingFields.includes("primary_role")) payload.set("primary_role", role);
    if (missingFields.includes("gender")) payload.set("gender", gender);
    if (missingFields.includes("nationality")) payload.set("nationality_slug", nationality);
    if (missingFields.includes("date_of_birth")) payload.set("date_of_birth", dateOfBirth);

    const result = await updateApprovedLegacyTalentRequiredFieldsAction(payload);
    setMessage(result.message);
    setSuccess(result.success);

    if (result.success) {
      try {
        const refreshed = (await getOwnTalentProfileAction(profileLocale)) as TalentSnapshot | null;
        setSnapshot(refreshed);
      } catch {
        window.location.replace(profilePath);
        return;
      }
    }

    setSaving(false);
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`w-full px-4 pb-4 sm:px-6 lg:px-8 ${consentAlsoMissing ? "pt-0" : "pt-28 lg:pt-32"} ${
        isArabic ? "xl:pr-[22rem]" : "xl:pl-[22rem]"
      }`}
    >
      <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/[0.045] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-emerald-300/85">
              {isArabic ? "تحديث آمن لملف قديم" : "Safe legacy profile update"}
            </p>
            <h2 className="mt-1 text-xl font-light text-white">
              {isArabic ? "أكمل البيانات الناقصة فقط" : "Complete only the missing details"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/55">
              {isArabic
                ? "اعتماد ملفك محفوظ. سنضيف فقط الحقول القديمة الناقصة ولن نغيّر أي بيانات موجودة أو نعيد ملفك للمراجعة."
                : "Your approval stays protected. We will only fill legacy missing fields and will not overwrite existing data or send your profile back to review."}
            </p>

            <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
              {missingFields.includes("phone") ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">{isArabic ? "رقم الجوال" : "Phone number"}</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    dir="ltr"
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-left text-white outline-none focus:border-gold/50"
                  />
                </label>
              ) : null}

              {missingFields.includes("primary_role") ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">{isArabic ? "نوع الموهبة" : "Talent type"}</span>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-gold/50"
                  >
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {TALENT_CATEGORIES.map((option) => (
                      <option key={option.slug} value={option.slug}>{isArabic ? option.ar : option.en}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {missingFields.includes("gender") ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">{isArabic ? "الجنس" : "Gender"}</span>
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-gold/50"
                  >
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{isArabic ? option.ar : option.en}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {missingFields.includes("nationality") ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">{isArabic ? "الجنسية" : "Nationality"}</span>
                  <select
                    value={nationality}
                    onChange={(event) => setNationality(event.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-gold/50"
                  >
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {NATIONALITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{isArabic ? option.ar : option.en}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {missingFields.includes("date_of_birth") ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-white/70">{isArabic ? "تاريخ الميلاد" : "Date of birth"}</span>
                  <input
                    type="date"
                    value={dateOfBirth}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    dir="ltr"
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-gold/50"
                  />
                </label>
              ) : null}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-6 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 size={17} aria-hidden="true" />
                  {saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ البيانات الناقصة" : "Save missing details")}
                </button>
                {message ? (
                  <p className={`mt-3 text-xs ${success ? "text-emerald-200" : "text-red-200"}`}>{message}</p>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}