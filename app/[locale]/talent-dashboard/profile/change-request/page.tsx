"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import {
  getOwnPendingTalentProfileChangeAction,
  getOwnTalentProfileAction,
} from "@/lib/actions/update-own-talent-profile";
import { requestOwnTalentProfileChangeAction } from "@/lib/actions/request-talent-profile-change";
import { NATIONALITY_OPTIONS } from "@/lib/data/talent-signup";
import { isValidLocale, type Locale } from "@/lib/i18n";

type TalentSnapshot = {
  name_ar?: string | null;
  name_en?: string | null;
  phone?: string | null;
  nationality_slug?: string | null;
  nationality?: string | null;
  approval_status?: string | null;
};

type PendingRequest = {
  id?: number | string;
  requested_name_ar?: string | null;
  requested_name_en?: string | null;
  requested_phone?: string | null;
  requested_nationality_slug?: string | null;
  status?: string | null;
  created_at?: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default function TalentProfileChangeRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = use(params);
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const isArabic = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [talent, setTalent] = useState<TalentSnapshot | null>(null);
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const [profile, pendingRequest] = await Promise.all([
        getOwnTalentProfileAction(locale) as Promise<TalentSnapshot | null>,
        getOwnPendingTalentProfileChangeAction(locale) as Promise<PendingRequest | null>,
      ]);
      setTalent(profile);
      setPending(pendingRequest);
      setName(clean(profile?.name_ar) || clean(profile?.name_en));
      setPhone(clean(profile?.phone));
      setNationality(clean(profile?.nationality_slug) || clean(profile?.nationality));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isArabic ? "تعذر تحميل بياناتك." : "Unable to load your details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || pending) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const payload = new FormData();
    payload.set("locale", locale);
    payload.set("name", name);
    payload.set("phone", phone);
    payload.set("nationality_slug", nationality);

    const result = await requestOwnTalentProfileChangeAction(payload);
    setMessage(result.message);
    setSuccess(result.success);
    if (result.success) await load();
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 pb-28 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-80 rounded-[2rem] bg-white/[0.03]" />
        </div>
      </main>
    );
  }

  const approved = clean(talent?.approval_status).toLowerCase() === "approved";

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-40 text-white sm:px-6 lg:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              {isArabic ? "تحديث الملف المعتمد" : "APPROVED PROFILE UPDATE"}
            </p>
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">
              {isArabic ? "تعديل بياناتك بدون فقدان الاعتماد" : "Update details without losing approval"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
              {isArabic
                ? "يمكنك تحسين بياناتك المهنية مباشرة. أما الاسم والجوال والجنسية فتُرسل كتحديث للمراجعة لحماية هوية الملف المعتمد."
                : "You can update professional details directly. Name, phone and nationality are submitted for review to protect the identity of an approved profile."}
            </p>
          </div>
          <Link href={`/${locale}/talent-dashboard/profile`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">
            {isArabic ? "رجوع" : "Back"}
          </Link>
        </div>

        {!approved ? (
          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 text-sm leading-7 text-amber-100">
            {isArabic ? "هذا المسار مخصص للملفات المعتمدة." : "This flow is for approved profiles."}
          </div>
        ) : pending ? (
          <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 sm:p-7">
            <p className="text-xs text-amber-200">{isArabic ? "طلب تعديل قيد المراجعة" : "Change request under review"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "وصلنا طلبك" : "Your request is in review"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {isArabic
                ? "يبقى ملفك معتمدًا وتظل بياناتك الحالية ظاهرة حتى اعتماد التحديث. لا تحتاج لإرسال طلب آخر."
                : "Your profile remains approved and current details stay live until the update is approved. No additional request is needed."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {clean(pending.requested_name_ar) ? <PendingItem label={isArabic ? "الاسم المطلوب" : "Requested name"} value={clean(pending.requested_name_ar)} /> : null}
              {clean(pending.requested_phone) ? <PendingItem label={isArabic ? "الجوال المطلوب" : "Requested phone"} value={clean(pending.requested_phone)} ltr /> : null}
              {clean(pending.requested_nationality_slug) ? <PendingItem label={isArabic ? "الجنسية المطلوبة" : "Requested nationality"} value={nationalityLabel(clean(pending.requested_nationality_slug), isArabic)} /> : null}
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={isArabic ? "الاسم الكامل" : "Full name"}>
                  <input value={name} onChange={(event) => setName(event.target.value)} className="input" />
                </Field>
                <Field label={isArabic ? "رقم الجوال" : "Phone number"}>
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} dir="ltr" className="input text-left" />
                </Field>
                <Field label={isArabic ? "الجنسية" : "Nationality"}>
                  <select value={nationality} onChange={(event) => setNationality(event.target.value)} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {NATIONALITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{isArabic ? option.ar : option.en}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="mt-5 text-xs leading-6 text-white/40">
                {isArabic
                  ? "لن يتغير اعتماد ملفك أثناء المراجعة، ولن نطبّق أي قيمة جديدة قبل اعتماد الطلب."
                  : "Your approval will not change while this request is reviewed, and no new value is applied before approval."}
              </p>
            </section>

            {message ? <div className={`rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>{message}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : (isArabic ? "إرسال التعديلات للمراجعة" : "Submit changes for review")}
              </button>
              <Link href={`/${locale}/talent-dashboard/profile/details`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/65 hover:border-gold/30 hover:text-gold">
                {isArabic ? "تعديل البيانات المهنية" : "Edit professional details"}
              </Link>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .input { width:100%; min-height:3.5rem; border-radius:1rem; border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.28); padding:.75rem 1rem; color:white; outline:none; }
        .input:focus { border-color:rgba(197,160,89,.55); }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      {children}
    </label>
  );
}

function PendingItem({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="mt-2 text-sm text-white/80" dir={ltr ? "ltr" : undefined}>{value}</p>
    </div>
  );
}

function nationalityLabel(value: string, isArabic: boolean) {
  const option = NATIONALITY_OPTIONS.find((item) => item.value === value);
  return option ? (isArabic ? option.ar : option.en) : value;
}
