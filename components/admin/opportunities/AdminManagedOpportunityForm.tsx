"use client";

import { useState } from "react";

import { createAdminOpportunityAutoTranslateFormAction } from "@/lib/actions/create-admin-opportunity-auto-translate";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

type SourceType = "mlamh" | "client";
type PublicSourceMode = "mlamh" | "client_name" | "mlamh_clients";
type CompensationType = "fixed" | "negotiable" | "unpaid";
type ContentLanguage = "ar" | "en";

export default function AdminManagedOpportunityForm() {
  const [sourceType, setSourceType] = useState<SourceType>("mlamh");
  const [publicSourceMode, setPublicSourceMode] =
    useState<PublicSourceMode>("mlamh");
  const [compensationType, setCompensationType] =
    useState<CompensationType>("fixed");
  const [contentLanguage, setContentLanguage] =
    useState<ContentLanguage>("ar");

  function handleSourceChange(nextSource: SourceType) {
    setSourceType(nextSource);
    setPublicSourceMode(nextSource === "mlamh" ? "mlamh" : "client_name");
  }

  const isArabicContent = contentLanguage === "ar";

  return (
    <form
      action={createAdminOpportunityAutoTranslateFormAction}
      className="grid gap-6"
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="text-xl font-semibold">مصدر الفرصة</h2>
        <p className="mt-2 text-sm text-white/40">
          حدد ما إذا كانت الفرصة تابعة لملامح أو تتم إدارتها نيابة عن عميل.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SourceOption
            selected={sourceType === "mlamh"}
            title="ملامح"
            description="فرصة تنشر وتدار مباشرة بواسطة ملامح."
            onClick={() => handleSourceChange("mlamh")}
          />
          <SourceOption
            selected={sourceType === "client"}
            title="نيابة عن عميل"
            description="ملامح تدير الفرصة والطلبات نيابة عن العميل."
            onClick={() => handleSourceChange("client")}
          />
        </div>

        <input type="hidden" name="source_type" value={sourceType} />

        {sourceType === "client" ? (
          <div className="mt-8 border-t border-white/10 pt-7">
            <h3 className="font-medium">بيانات العميل الداخلية</h3>
            <p className="mt-1 text-xs text-white/35">
              هذه البيانات للإدارة ولا تظهر كبيانات تواصل عامة للمواهب.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field
                name="client_company_name"
                label="اسم الجهة / العميل"
                placeholder="مثال: شركة ABC"
                required
              />
              <Field name="contact_name" label="اسم مسؤول العميل" />
              <Field name="contact_phone" label="رقم التواصل" />
              <Field
                name="contact_email"
                label="البريد الإلكتروني"
                type="email"
              />
            </div>

            <p className="mb-3 mt-7 text-sm text-white/60">
              كيف تظهر الجهة للمستخدمين؟
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <VisibilityOption
                value="client_name"
                current={publicSourceMode}
                onChange={setPublicSourceMode}
                title="اسم العميل"
                description="إظهار اسم الجهة"
              />
              <VisibilityOption
                value="mlamh_clients"
                current={publicSourceMode}
                onChange={setPublicSourceMode}
                title="من عملاء ملامح"
                description="بدون إظهار اسم العميل"
              />
              <VisibilityOption
                value="mlamh"
                current={publicSourceMode}
                onChange={setPublicSourceMode}
                title="ملامح"
                description="تظهر كفرصة من ملامح"
              />
            </div>
          </div>
        ) : null}

        <input
          type="hidden"
          name="public_source_mode"
          value={publicSourceMode}
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">محتوى الفرصة</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
              اكتب العنوان والوصف بلغة واحدة فقط. ملامح سيترجم المحتوى تلقائيًا
              إلى اللغة الثانية عند الحفظ أو النشر.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setContentLanguage("ar")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                contentLanguage === "ar"
                  ? "bg-[#c8a45d] text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setContentLanguage("en")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                contentLanguage === "en"
                  ? "bg-[#c8a45d] text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              English
            </button>
          </div>
        </div>

        <input type="hidden" name="content_language" value={contentLanguage} />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            name="title"
            label={isArabicContent ? "عنوان الفرصة" : "Opportunity Title"}
            placeholder={
              isArabicContent
                ? "مثال: مطلوب ممثل لحملة إعلانية"
                : "Example: Actor needed for a commercial campaign"
            }
            dir={isArabicContent ? "rtl" : "ltr"}
            required
          />

          <SelectField name="opportunity_type" label="نوع الفرصة" required>
            <option value="model">مودل</option>
            <option value="actor">ممثل</option>
          </SelectField>

          <SelectField name="city_slug" label="المدينة" required>
            <option value="">اختر المدينة</option>
            {SAUDI_CITIES.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.ar}
              </option>
            ))}
          </SelectField>

          <SelectField name="required_gender" label="الجنس المطلوب">
            <option value="any">أي جنس</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
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
            {isArabicContent ? "وصف الفرصة" : "Opportunity Description"}
          </span>
          <textarea
            name="description"
            required
            rows={9}
            dir={isArabicContent ? "rtl" : "ltr"}
            placeholder={
              isArabicContent
                ? "اكتب تفاصيل الفرصة والمتطلبات والتنبيهات..."
                : "Write the opportunity details, requirements, and notices..."
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#c8a45d]/50"
          />
        </label>

        <div className="mt-4 rounded-2xl border border-[#c8a45d]/20 bg-[#c8a45d]/[0.06] px-4 py-3 text-xs leading-6 text-[#d8bd82]">
          الترجمة التلقائية تحافظ على الأسماء والأرقام والتواريخ والمتطلبات، ولا
          تضيف وعودًا أو معلومات غير موجودة في النص الأصلي.
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
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-[#c8a45d]/50"
            >
              <option value="fixed">مبلغ ثابت</option>
              <option value="negotiable">حسب الاتفاق</option>
              <option value="unpaid">غير مدفوع</option>
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
        <h2 className="text-xl font-semibold">استقبال الطلبات والعمل</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <SelectField
            name="application_days"
            label="مدة استقبال الطلبات"
            required
          >
            <option value="3">3 أيام</option>
            <option value="7">7 أيام</option>
            <option value="14">14 يومًا</option>
            <option value="30">30 يومًا</option>
          </SelectField>
          <Field name="work_date" label="تاريخ العمل" type="date" />
          <Field name="work_time" label="وقت العمل" type="time" />
          <Field
            name="work_duration"
            label="مدة العمل"
            placeholder="مثال: 4 ساعات"
          />
        </div>
      </section>

      <input type="hidden" name="posting_mode" value="project" />

      <div className="flex flex-wrap justify-end gap-3 pb-8">
        <button
          type="submit"
          name="publish_now"
          value="false"
          className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition hover:bg-white/5"
        >
          حفظ كمسودة وترجمة
        </button>
        <button
          type="submit"
          name="publish_now"
          value="true"
          className="rounded-full bg-[#c8a45d] px-8 py-3 text-sm font-medium text-black transition hover:opacity-90"
        >
          ترجمة ونشر الآن
        </button>
      </div>
    </form>
  );
}

function SourceOption({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-right transition ${
        selected
          ? "border-[#c8a45d]/60 bg-[#c8a45d]/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <span className="block font-medium">{title}</span>
      <span className="mt-2 block text-xs leading-5 text-white/40">
        {description}
      </span>
    </button>
  );
}

function VisibilityOption({
  value,
  current,
  onChange,
  title,
  description,
}: {
  value: PublicSourceMode;
  current: PublicSourceMode;
  onChange: (value: PublicSourceMode) => void;
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
      <span className="text-sm text-white/60">{label}</span>
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
