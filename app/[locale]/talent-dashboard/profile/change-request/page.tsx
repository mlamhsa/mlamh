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
      <main className="min-h-screen bg-background px-4 pb-28 text-white sm:px-6" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-28 rounded-[1.75rem] bg-white/[0.03]" />
          <div className="h-80 rounded-[2rem] bg-white/[0.03]" />
        </div>
      </main>
    );
  }

  const approved = clean(talent?.approval_status).toLowerCase() === "approved";

  return (
    <main className="min-h-screen bg-background px-4 pb-28 text-white sm:px-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <section className="mb-5 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
                  {isArabic ? "البيانات الأساسية المحمية" : "PROTECTED CORE DETAILS"}
                </p>
                {approved ? (
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] text-emerald-100">
                    {isArabic ? "الاعتماد محفوظ" : "Approval stays active"}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-2xl font-light sm:text-3xl">
                {isArabic ? "طلب تعديل الاسم أو الجوال أو الجنسية" : "Request a protected detail change"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/50">
                {isArabic
                  ? "بياناتك الحالية تبقى ظاهرة ويظل اعتماد الملف فعالًا أثناء المراجعة. لا يتم تطبيق أي قيمة جديدة إلا بعد اعتماد الطلب."
                  : "Your current details remain live and your profile stays approved while the request is reviewed. New values are only applied after approval."}
              </p>
            </div>
            <Link
              href={`/${locale}/talent-dashboard/profile/details`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold"
            >
              {isArabic ? "العودة لتعديل الملف" : "Back to profile editor"}
            </Link>
          </div>
        </section>

        {!approved ? (
          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 text-sm leading-7 text-amber-100">
            {isArabic ? "هذا المسار مخصص للملفات المعتمدة." : "This flow is for approved profiles."}
          </div>
        ) : pending ? (
          <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-3 py-1 text-[11px] text-amber-100">
                    {isArabic ? "قيد المراجعة" : "Under review"}
                  </span>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1 text-[11px] text-emerald-100">
                    {isArabic ? "ملفك ما زال معتمدًا" : "Your profile stays approved"}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-light">{isArabic ? "وصلنا طلب التعديل" : "Your change request is in review"}</h2>
                <p className="mt-3 text-sm leading-7 text-white/55">
                  {isArabic
                    ? "لا تحتاج إلى إرسال طلب آخر. ستبقى بياناتك الحالية ظاهرة حتى اعتماد التحديث، ويمكنك الاستمرار في تعديل بياناتك المهنية بشكل طبيعي."
                    : "You do not need to send another request. Current details remain live until approval, and you can keep editing professional details normally."}
                </p>
              </div>
              <Link
                href={`/${locale}/talent-dashboard/profile/details`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 px-5 text-sm text-white/65 transition hover:border-gold/30 hover:text-gold"
              >
                {isArabic ? "تعديل البيانات المهنية" : "Edit professional details"}
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clean(pending.requested_name_ar) ? <PendingItem label={isArabic ? "الاسم المطلوب" : "Requested name"} value={clean(pending.requested_name_ar)} /> : null}
              {clean(pending.requested_phone) ? <PendingItem label={isArabic ? "الجوال المطلوب" : "Requested phone"} value={clean(pending.requested_phone)} ltr /> : null}
              {clean(pending.requested_nationality_slug) ? <PendingItem label={isArabic ? "الجنسية المطلوبة" : "Requested nationality"} value={nationalityLabel(clean(pending.requested_nationality_slug), isArabic)} /> : null}
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                      {isArabic ? "القيم الجديدة" : "NEW VALUES"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/45">
                      {isArabic ? "عدّل فقط ما تحتاج تغييره، ثم أرسل الطلب للمراجعة." : "Change only what you need, then submit the request for review."}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/40">
                    {isArabic ? "يتطلب مراجعة" : "Review required"}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
              </section>

              <aside className="rounded-[2rem] border border-emerald-400/15 bg-emerald-400/[0.035] p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  {isArabic ? "ماذا يحدث بعد الإرسال؟" : "WHAT HAPPENS NEXT?"}
                </p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-white/55">
                  <p>{isArabic ? "يبقى ملفك معتمدًا ونشطًا." : "Your profile remains approved and active."}</p>
                  <p>{isArabic ? "تبقى البيانات الحالية ظاهرة أثناء المراجعة." : "Current details stay visible during review."}</p>
                  <p>{isArabic ? "لن نطبّق أي قيمة جديدة قبل اعتماد الطلب." : "No new value is applied before the request is approved."}</p>
                </div>
                <Link
                  href={`/${locale}/talent-dashboard/profile/details`}
                  className="mt-6 inline-flex text-sm text-gold transition hover:text-white"
                >
                  {isArabic ? "تحتاج لتعديل الطول أو الوزن أو المهارات؟ عدّلها مباشرة ←" : "Need to change measurements or skills? Edit them directly →"}
                </Link>
              </aside>
            </div>

            {message ? <div className={`rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>{message}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : (isArabic ? "إرسال طلب التعديل" : "Submit change request")}
              </button>
              <Link href={`/${locale}/talent-dashboard/profile/details`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/65 hover:border-gold/30 hover:text-gold">
                {isArabic ? "إلغاء والعودة للمحرر" : "Cancel and return to editor"}
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
