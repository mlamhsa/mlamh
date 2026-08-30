"use client";

import { useState } from "react";

import { createAdminLocalizedOpportunityFormAction } from "@/lib/actions/create-admin-localized-opportunity";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

type SourceType = "mlamh" | "client";
type PublicSourceMode = "mlamh" | "client_name" | "mlamh_clients";
type CompensationType = "fixed" | "negotiable" | "unpaid";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#c8a45d]/50";

export default function AdminLocalizedOpportunityForm() {
  const [sourceType, setSourceType] = useState<SourceType>("mlamh");
  const [publicSourceMode, setPublicSourceMode] =
    useState<PublicSourceMode>("mlamh");
  const [compensationType, setCompensationType] =
    useState<CompensationType>("fixed");

  function changeSource(next: SourceType) {
    setSourceType(next);
    setPublicSourceMode(next === "mlamh" ? "mlamh" : "client_name");
  }

  return (
    <form action={createAdminLocalizedOpportunityFormAction} className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">مصدر الفرصة</h2>
        <p className="mt-2 text-sm text-white/40">
          اختر ما إذا كانت الفرصة من ملامح أو تتم إدارتها نيابة عن عميل.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Choice
            active={sourceType === "mlamh"}
            title="ملامح"
            description="تنشر وتدار مباشرة بواسطة ملامح."
            onClick={() => changeSource("mlamh")}
          />
          <Choice
            active={sourceType === "client"}
            title="نيابة عن عميل"
            description="ملامح تدير الفرصة والطلبات نيابة عن العميل."
            onClick={() => changeSource("client")}
          />
        </div>

        <input type="hidden" name="source_type" value={sourceType} />

        {sourceType === "client" ? (
          <div className="mt-7 border-t border-white/10 pt-7">
            <div className="grid gap-4 md:grid-cols-2">
              <Field name="client_company_name" label="اسم الجهة / العميل" required />
              <Field name="contact_name" label="اسم مسؤول العميل" />
              <Field name="contact_phone" label="رقم التواصل" />
              <Field name="contact_email" label="البريد الإلكتروني" type="email" />
            </div>

            <div className="mt-6">
              <p className="text-sm text-white/60">كيف تظهر الجهة للمستخدمين؟</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Choice
                  active={publicSourceMode === "client_name"}
                  title="اسم العميل"
                  description="يظهر اسم الجهة للموهبة."
                  onClick={() => setPublicSourceMode("client_name")}
                />
                <Choice
                  active={publicSourceMode === "mlamh_clients"}
                  title="من عملاء ملامح"
                  description="لا يظهر اسم العميل."
                  onClick={() => setPublicSourceMode("mlamh_clients")}
                />
                <Choice
                  active={publicSourceMode === "mlamh"}
                  title="ملامح"
                  description="تظهر كفرصة من ملامح."
                  onClick={() => setPublicSourceMode("mlamh")}
                />
              </div>
            </div>
          </div>
        ) : null}

        <input type="hidden" name="public_source_mode" value={publicSourceMode} />
      </section>

      <section className="rounded-[2rem] border border-[#c8a45d]/20 bg-white/[0.025] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c8a45d]">AR</p>
            <h2 className="mt-1 text-xl font-semibold">المحتوى العربي</h2>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40">
            يظهر في /ar
          </span>
        </div>

        <div className="mt-6">
          <Field name="title" label="عنوان الفرصة بالعربية" required dir="rtl" />
          <TextArea
            name="description"
            label="وصف الفرصة بالعربية"
            required
            dir="rtl"
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#c8a45d]/20 bg-white/[0.025] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#c8a45d]">EN</p>
            <h2 className="mt-1 text-xl font-semibold">English Content</h2>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40">
            Appears on /en
          </span>
        </div>

        <div className="mt-6">
          <Field name="title_en" label="Opportunity title in English" required dir="ltr" />
          <TextArea
            name="description_en"
            label="Opportunity description in English"
            required
            dir="ltr"
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">بيانات الفرصة</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Select name="opportunity_type" label="نوع الفرصة">
            <option value="model">مودل</option>
            <option value="actor">ممثل</option>
          </Select>

          <Select name="city_slug" label="المدينة" required>
            <option value="">اختر المدينة</option>
            {SAUDI_CITIES.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.ar} — {city.en}
              </option>
            ))}
          </Select>

          <Select name="required_gender" label="الجنس المطلوب">
            <option value="any">أي جنس</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </Select>

          <Field name="required_count" label="العدد المطلوب" type="number" min="1" />
          <Field name="min_age" label="الحد الأدنى للعمر" type="number" min="0" max="100" />
          <Field name="max_age" label="الحد الأعلى للعمر" type="number" min="0" max="100" />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">المقابل</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-white/60">نوع المقابل</span>
            <select
              name="compensation_type"
              value={compensationType}
              onChange={(event) =>
                setCompensationType(event.target.value as CompensationType)
              }
              className={inputClass}
            >
              <option value="fixed">مبلغ ثابت</option>
              <option value="negotiable">حسب الاتفاق</option>
              <option value="unpaid">غير مدفوع</option>
            </select>
          </label>

          {compensationType === "fixed" ? (
            <Field name="budget" label="المبلغ بالريال" type="number" min="1" required />
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">استقبال الطلبات والعمل</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Select name="application_days" label="مدة استقبال الطلبات" required>
            <option value="3">3 أيام</option>
            <option value="7">7 أيام</option>
            <option value="14">14 يومًا</option>
            <option value="30">30 يومًا</option>
          </Select>
          <Field name="work_date" label="تاريخ العمل" type="date" />
          <Field name="work_time" label="وقت العمل" type="time" />
          <Field name="work_duration" label="مدة العمل" placeholder="مثال: 4 ساعات / 4 Hours" />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3 pb-8">
        <button
          type="submit"
          name="publish_now"
          value="false"
          className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition hover:bg-white/5"
        >
          حفظ كمسودة
        </button>
        <button
          type="submit"
          name="publish_now"
          value="true"
          className="rounded-full bg-[#c8a45d] px-8 py-3 text-sm font-medium text-black transition hover:opacity-90"
        >
          نشر الآن
        </button>
      </div>
    </form>
  );
}

function Choice({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-right transition ${
        active
          ? "border-[#c8a45d]/60 bg-[#c8a45d]/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs text-white/35">{description}</span>
    </button>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
  dir,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        dir={dir}
        className={inputClass}
      />
    </label>
  );
}

function TextArea({
  name,
  label,
  required,
  dir,
}: {
  name: string;
  label: string;
  required?: boolean;
  dir: "rtl" | "ltr";
}) {
  return (
    <label className="mt-5 block">
      <span className="text-sm text-white/60">{label}</span>
      <textarea
        name={name}
        required={required}
        rows={8}
        dir={dir}
        className={`${inputClass} whitespace-pre-wrap`}
      />
    </label>
  );
}

function Select({
  name,
  label,
  children,
  required,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">{label}</span>
      <select name={name} required={required} className={inputClass}>
        {children}
      </select>
    </label>
  );
}
