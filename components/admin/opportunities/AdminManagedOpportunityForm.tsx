"use client";

import { useState } from "react";

import { createAdminOpportunityFormAction } from "@/lib/actions/create-admin-opportunity";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

type SourceType = "mlamh" | "client";

type PublicSourceMode =
  | "mlamh"
  | "client_name"
  | "mlamh_clients";

type CompensationType =
  | "fixed"
  | "negotiable"
  | "unpaid";

export default function AdminManagedOpportunityForm() {
  const [sourceType, setSourceType] =
    useState<SourceType>("mlamh");

  const [publicSourceMode, setPublicSourceMode] =
    useState<PublicSourceMode>("mlamh");

  const [compensationType, setCompensationType] =
    useState<CompensationType>("fixed");

  function handleSourceChange(
    nextSource: SourceType,
  ) {
    setSourceType(nextSource);

    if (nextSource === "mlamh") {
      setPublicSourceMode("mlamh");
    } else {
      setPublicSourceMode("client_name");
    }
  }

  return (
    <form
      action={createAdminOpportunityFormAction}
      className="grid gap-6"
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">
          مصدر الفرصة
        </h2>

        <p className="mt-2 text-sm text-white/40">
          حدد ما إذا كانت الفرصة تابعة لملامح أو تتم إدارتها نيابة عن عميل.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label
            className={`cursor-pointer rounded-2xl border p-5 transition ${
              sourceType === "mlamh"
                ? "border-[#c8a45d]/60 bg-[#c8a45d]/10"
                : "border-white/10 bg-black/20"
            }`}
          >
            <input
              type="radio"
              name="source_type"
              value="mlamh"
              checked={sourceType === "mlamh"}
              onChange={() =>
                handleSourceChange("mlamh")
              }
              className="ml-2"
            />

            <span className="font-medium">
              ملامح
            </span>

            <p className="mt-2 text-xs leading-5 text-white/40">
              فرصة تنشر وتدار مباشرة بواسطة ملامح.
            </p>
          </label>

          <label
            className={`cursor-pointer rounded-2xl border p-5 transition ${
              sourceType === "client"
                ? "border-[#c8a45d]/60 bg-[#c8a45d]/10"
                : "border-white/10 bg-black/20"
            }`}
          >
            <input
              type="radio"
              name="source_type"
              value="client"
              checked={sourceType === "client"}
              onChange={() =>
                handleSourceChange("client")
              }
              className="ml-2"
            />

            <span className="font-medium">
              نيابة عن عميل
            </span>

            <p className="mt-2 text-xs leading-5 text-white/40">
              ملامح تدير الفرصة والطلبات نيابة عن العميل.
            </p>
          </label>
        </div>

        {sourceType === "client" ? (
          <div className="mt-8 border-t border-white/10 pt-7">
            <div className="mb-5">
              <h3 className="font-medium">
                بيانات العميل الداخلية
              </h3>

              <p className="mt-1 text-xs text-white/35">
                هذه البيانات مخصصة للإدارة ولا تستخدم كبيانات تواصل عامة للمواهب.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                name="client_company_name"
                label="اسم الجهة / العميل"
                placeholder="مثال: شركة ABC"
                required
              />

              <Field
                name="contact_name"
                label="اسم مسؤول العميل"
              />

              <Field
                name="contact_phone"
                label="رقم التواصل"
              />

              <Field
                name="contact_email"
                label="البريد الإلكتروني"
                type="email"
              />
            </div>

            <div className="mt-7">
              <p className="mb-3 text-sm text-white/60">
                كيف تظهر الجهة للمستخدمين؟
              </p>

              <div className="grid gap-3 md:grid-cols-3">
                <SourceVisibilityOption
                  value="client_name"
                  current={publicSourceMode}
                  onChange={setPublicSourceMode}
                  title="اسم العميل"
                  description="مثال: شركة ABC"
                />

                <SourceVisibilityOption
                  value="mlamh_clients"
                  current={publicSourceMode}
                  onChange={setPublicSourceMode}
                  title="من عملاء ملامح"
                  description="بدون إظهار اسم العميل"
                />

                <SourceVisibilityOption
                  value="mlamh"
                  current={publicSourceMode}
                  onChange={setPublicSourceMode}
                  title="ملامح"
                  description="تظهر كفرصة من ملامح"
                />
              </div>

              <input
                type="hidden"
                name="public_source_mode"
                value={publicSourceMode}
              />
            </div>
          </div>
        ) : (
          <input
            type="hidden"
            name="public_source_mode"
            value="mlamh"
          />
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">
          بيانات الفرصة
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            name="title"
            label="عنوان الفرصة"
            required
          />

          <SelectField
            name="opportunity_type"
            label="نوع الفرصة"
            required
          >
            <option value="model">
              مودل
            </option>
            <option value="actor">
              ممثل
            </option>
          </SelectField>

          <SelectField
            name="city_slug"
            label="المدينة"
            required
          >
            <option value="">
              اختر المدينة
            </option>

            {SAUDI_CITIES.map((city) => (
  <option
    key={city.slug}
    value={city.slug}
  >
    {city.ar}
  </option>
))}
          </SelectField>

          <SelectField
            name="required_gender"
            label="الجنس المطلوب"
          >
            <option value="any">
              أي جنس
            </option>
            <option value="male">
              ذكر
            </option>
            <option value="female">
              أنثى
            </option>
          </SelectField>

          <Field
            name="min_age"
            label="الحد الأدنى للعمر"
            type="number"
            min="0"
            max="100"
          />

          <Field
            name="max_age"
            label="الحد الأعلى للعمر"
            type="number"
            min="0"
            max="100"
          />

          <Field
            name="required_count"
            label="العدد المطلوب"
            type="number"
            min="1"
          />
        </div>

        <label className="mt-5 block">
          <span className="text-sm text-white/60">
            وصف الفرصة
          </span>

          <textarea
            name="description"
            required
            rows={7}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#c8a45d]/50"
          />
        </label>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">
          المقابل
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-white/60">
              نوع المقابل
            </span>

            <select
              name="compensation_type"
              value={compensationType}
              onChange={(event) =>
                setCompensationType(
                  event.target
                    .value as CompensationType,
                )
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-[#c8a45d]/50"
            >
              <option value="fixed">
                مبلغ ثابت
              </option>

              <option value="negotiable">
                حسب الاتفاق
              </option>

              <option value="unpaid">
                غير مدفوع
              </option>
            </select>
          </label>

          {compensationType === "fixed" ? (
            <Field
              name="budget"
              label="المبلغ بالريال"
              type="number"
              min="1"
              required
            />
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">
          استقبال الطلبات والعمل
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <SelectField
            name="application_days"
            label="مدة استقبال الطلبات"
            required
          >
            <option value="3">
              3 أيام
            </option>
            <option value="7">
              7 أيام
            </option>
            <option value="14">
              14 يومًا
            </option>
            <option value="30">
              30 يومًا
            </option>
          </SelectField>

          <Field
            name="work_date"
            label="تاريخ العمل"
            type="date"
          />

          <Field
            name="work_time"
            label="وقت العمل"
            type="time"
          />

          <Field
            name="work_duration"
            label="مدة العمل"
            placeholder="مثال: 4 ساعات"
          />
        </div>
      </section>

      <input
        type="hidden"
        name="posting_mode"
        value="project"
      />

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

function SourceVisibilityOption({
  value,
  current,
  onChange,
  title,
  description,
}: {
  value: PublicSourceMode;
  current: PublicSourceMode;
  onChange: (
    value: PublicSourceMode,
  ) => void;
  title: string;
  description: string;
}) {
  const selected = current === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-2xl border p-4 text-right transition ${
        selected
          ? "border-[#c8a45d]/60 bg-[#c8a45d]/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <span className="block text-sm font-medium">
        {title}
      </span>

      <span className="mt-1 block text-xs text-white/35">
        {description}
      </span>
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
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">
        {label}
      </span>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#c8a45d]/50"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  children,
  required = false,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">
        {label}
      </span>

      <select
        name={name}
        required={required}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-[#c8a45d]/50"
      >
        {children}
      </select>
    </label>
  );
}