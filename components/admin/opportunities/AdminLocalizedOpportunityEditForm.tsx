"use client";

import { useState } from "react";

import { updateAdminLocalizedOpportunityFormAction } from "@/lib/actions/update-admin-localized-opportunity";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

type CompensationType = "fixed" | "negotiable" | "unpaid";
type PublicSourceMode = "mlamh" | "client_name" | "mlamh_clients";

type InitialValues = {
  opportunityId: number;
  sourceType: "mlamh" | "client";
  publicSourceMode: PublicSourceMode;
  clientCompanyName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  title: string;
  description: string;
  opportunityType: "actor" | "model";
  citySlug?: string | null;
  requiredGender?: "any" | "male" | "female" | null;
  minAge?: number | null;
  maxAge?: number | null;
  requiredCount?: number | null;
  compensationType: CompensationType;
  budget?: string | number | null;
  applicationDays?: number | null;
  workDate?: string | null;
  workTime?: string | null;
  workDuration?: string | null;
};

const inputClass = "mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#c8a45d]/50";

export default function AdminLocalizedOpportunityEditForm({ initialValues }: { initialValues: InitialValues }) {
  const [compensationType, setCompensationType] = useState<CompensationType>(initialValues.compensationType);
  const [publicSourceMode, setPublicSourceMode] = useState<PublicSourceMode>(initialValues.publicSourceMode);

  return (
    <form action={updateAdminLocalizedOpportunityFormAction} className="grid gap-6">
      <input type="hidden" name="opportunity_id" value={initialValues.opportunityId} />
      <input type="hidden" name="public_source_mode" value={publicSourceMode} />

      <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-gold/70">MLAMH MANAGED DRAFT</p>
        <h2 className="mt-2 text-xl font-semibold">تعديل المسودة قبل النشر</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">عدّل البيانات ثم احفظها كمسودة أو انشرها بعد مراجعتك. لن يتم أي نشر بمجرد فتح هذه الصفحة.</p>
      </section>

      {initialValues.sourceType === "client" ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
          <h2 className="text-xl font-semibold">العميل والجهة</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field name="client_company_name" label="اسم الجهة / العميل" required defaultValue={initialValues.clientCompanyName ?? undefined} />
            <Field name="contact_name" label="اسم مسؤول العميل" defaultValue={initialValues.contactName ?? undefined} />
            <Field name="contact_phone" label="رقم التواصل" defaultValue={initialValues.contactPhone ?? undefined} />
            <Field name="contact_email" label="البريد الإلكتروني" type="email" defaultValue={initialValues.contactEmail ?? undefined} />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Choice active={publicSourceMode === "client_name"} title="اسم العميل" onClick={() => setPublicSourceMode("client_name")} />
            <Choice active={publicSourceMode === "mlamh_clients"} title="من عملاء ملامح" onClick={() => setPublicSourceMode("mlamh_clients")} />
            <Choice active={publicSourceMode === "mlamh"} title="ملامح" onClick={() => setPublicSourceMode("mlamh")} />
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[#c8a45d]/20 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">محتوى الفرصة</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">يتم تحديث النسخة الإنجليزية تلقائيًا عند الحفظ.</p>
        <div className="mt-6">
          <Field name="title" label="عنوان الفرصة" required dir="rtl" defaultValue={initialValues.title} />
          <TextArea name="description" label="وصف الفرصة" required dir="rtl" defaultValue={initialValues.description} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">بيانات الفرصة</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Select name="opportunity_type" label="نوع الفرصة" defaultValue={initialValues.opportunityType}><option value="model">مودل</option><option value="actor">ممثل</option></Select>
          <Select name="city_slug" label="المدينة" required defaultValue={initialValues.citySlug ?? ""}><option value="">اختر المدينة</option>{SAUDI_CITIES.map((city) => <option key={city.slug} value={city.slug}>{city.ar} — {city.en}</option>)}</Select>
          <Select name="required_gender" label="الجنس المطلوب" defaultValue={initialValues.requiredGender ?? "any"}><option value="any">أي جنس</option><option value="male">ذكر</option><option value="female">أنثى</option></Select>
          <Field name="required_count" label="العدد المطلوب" type="number" min="1" defaultValue={initialValues.requiredCount ?? undefined} />
          <Field name="min_age" label="الحد الأدنى للعمر" type="number" min="0" max="100" defaultValue={initialValues.minAge ?? undefined} />
          <Field name="max_age" label="الحد الأعلى للعمر" type="number" min="0" max="100" defaultValue={initialValues.maxAge ?? undefined} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">المقابل</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block"><span className="text-sm text-white/60">نوع المقابل</span><select name="compensation_type" value={compensationType} onChange={(event) => setCompensationType(event.target.value as CompensationType)} className={inputClass}><option value="fixed">مبلغ ثابت</option><option value="negotiable">حسب الاتفاق</option><option value="unpaid">غير مدفوع</option></select></label>
          {compensationType === "fixed" ? <Field name="budget" label="المبلغ بالريال" type="number" min="1" required defaultValue={initialValues.budget ?? undefined} /> : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">استقبال الطلبات والعمل</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Select name="application_days" label="مدة استقبال الطلبات" required defaultValue={String(initialValues.applicationDays ?? 7)}><option value="3">3 أيام</option><option value="7">7 أيام</option><option value="14">14 يومًا</option><option value="30">30 يومًا</option></Select>
          <Field name="work_date" label="تاريخ العمل" type="date" defaultValue={initialValues.workDate ?? undefined} />
          <Field name="work_time" label="وقت العمل" type="time" defaultValue={initialValues.workTime ?? undefined} />
          <Field name="work_duration" label="مدة العمل" placeholder="مثال: 4 ساعات" defaultValue={initialValues.workDuration ?? undefined} />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3 pb-8">
        <button type="submit" name="publish_now" value="false" className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition hover:bg-white/5">حفظ التعديلات كمسودة</button>
        <button type="submit" name="publish_now" value="true" className="rounded-full bg-[#c8a45d] px-8 py-3 text-sm font-medium text-black transition hover:opacity-90">حفظ ونشر الآن</button>
      </div>
    </form>
  );
}

function Choice({ active, title, onClick }: { active: boolean; title: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-right transition ${active ? "border-[#c8a45d]/60 bg-[#c8a45d]/10" : "border-white/10 bg-black/20"}`}><span className="block text-sm font-medium">{title}</span></button>;
}

function Field({ name, label, type = "text", placeholder, required = false, min, max, dir, defaultValue }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean; min?: string; max?: string; dir?: "rtl" | "ltr"; defaultValue?: string | number }) {
  return <label className="block"><span className="text-sm text-white/60">{label}</span><input name={name} type={type} placeholder={placeholder} required={required} min={min} max={max} dir={dir} defaultValue={defaultValue} className={inputClass} /></label>;
}

function TextArea({ name, label, required, dir, defaultValue }: { name: string; label: string; required?: boolean; dir: "rtl" | "ltr"; defaultValue?: string }) {
  return <label className="mt-5 block"><span className="text-sm text-white/60">{label}</span><textarea name={name} required={required} rows={8} dir={dir} defaultValue={defaultValue} className={`${inputClass} whitespace-pre-wrap`} /></label>;
}

function Select({ name, label, children, required, defaultValue }: { name: string; label: string; children: React.ReactNode; required?: boolean; defaultValue?: string }) {
  return <label className="block"><span className="text-sm text-white/60">{label}</span><select name={name} required={required} defaultValue={defaultValue} className={inputClass}>{children}</select></label>;
}
