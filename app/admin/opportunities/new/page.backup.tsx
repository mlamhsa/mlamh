import Link from "next/link";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  createAdminOpportunityAction,
  type CreateAdminOpportunityInput,
} from "@/lib/actions/create-admin-opportunity";

export const metadata = {
  title: "Create Managed Opportunity — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCreateOpportunityPage() {
  await requireAdminAccess();

  async function createOpportunity(formData: FormData) {
    "use server";

    const sourceType =
      formData.get("source_type") === "client"
        ? "client"
        : "mlamh";

    const opportunityType =
      formData.get("opportunity_type") === "actor"
        ? "actor"
        : "model";

    const requiredGenderValue =
      formData.get("required_gender");

    const requiredGender:
      | "any"
      | "male"
      | "female" =
      requiredGenderValue === "male" ||
      requiredGenderValue === "female"
        ? requiredGenderValue
        : "any";

    const compensationValue =
      formData.get("compensation_type");

    const compensationType:
      | "fixed"
      | "negotiable"
      | "unpaid" =
      compensationValue === "negotiable" ||
      compensationValue === "unpaid"
        ? compensationValue
        : "fixed";

    const numberValue = (
      value: FormDataEntryValue | null,
    ) => {
      if (
        typeof value !== "string" ||
        !value.trim()
      ) {
        return null;
      }

      const parsed = Number(value);

      return Number.isFinite(parsed)
        ? parsed
        : null;
    };

    const stringValue = (
      value: FormDataEntryValue | null,
    ) =>
      typeof value === "string"
        ? value.trim()
        : "";

    const input: CreateAdminOpportunityInput = {
      sourceType,

      companyName:
        stringValue(
          formData.get("company_name"),
        ) || null,

      contactName:
        stringValue(
          formData.get("contact_name"),
        ) || null,

      contactPhone:
        stringValue(
          formData.get("contact_phone"),
        ) || null,

      contactEmail:
        stringValue(
          formData.get("contact_email"),
        ) || null,

      postingMode:
        formData.get("posting_mode") === "quick"
          ? "quick"
          : "project",

      title: stringValue(
        formData.get("title"),
      ),

      description: stringValue(
        formData.get("description"),
      ),

      opportunityType,

      citySlug:
        stringValue(
          formData.get("city_slug"),
        ) || null,

      cityAr:
        stringValue(
          formData.get("city_ar"),
        ) || null,

      cityEn:
        stringValue(
          formData.get("city_en"),
        ) || null,

      requiredGender,

      minAge: numberValue(
        formData.get("min_age"),
      ),

      maxAge: numberValue(
        formData.get("max_age"),
      ),

      budget:
        stringValue(
          formData.get("budget"),
        ) || null,

      compensationType,

      applicationStartDate:
        stringValue(
          formData.get(
            "application_start_date",
          ),
        ) || null,

      applicationDeadline:
        stringValue(
          formData.get(
            "application_deadline",
          ),
        ) || null,

      applicationDays: numberValue(
        formData.get("application_days"),
      ),

      requiredCount: numberValue(
        formData.get("required_count"),
      ),

      workDate:
        stringValue(
          formData.get("work_date"),
        ) || null,

      workTime:
        stringValue(
          formData.get("work_time"),
        ) || null,

      workDuration:
        stringValue(
          formData.get("work_duration"),
        ) || null,

      roleRequirements: {},

      publishNow:
        formData.get("publish_now") ===
        "true",
    };

    await createAdminOpportunityAction(
      input,
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c8a45d]">
              MLAMH Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              إنشاء فرصة مُدارة
            </h1>

            <p className="mt-2 text-sm text-white/50">
              انشر فرصة باسم ملامح أو نيابة عن عميل بدون إنشاء حساب ناشر.
            </p>
          </div>

          <Link
            href="/admin/opportunities"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
          >
            العودة للفرص
          </Link>
        </div>

        <form
          action={createOpportunity}
          className="grid gap-6"
        >
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-medium">
              مصدر الفرصة
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-white/10 p-4">
                <input
                  type="radio"
                  name="source_type"
                  value="mlamh"
                  defaultChecked
                  className="mr-2"
                />

                ملامح
              </label>

              <label className="rounded-2xl border border-white/10 p-4">
                <input
                  type="radio"
                  name="source_type"
                  value="client"
                  className="mr-2"
                />

                نيابة عن عميل
              </label>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field
                name="company_name"
                label="اسم الجهة / العميل"
                placeholder="مثال: شركة ABC"
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
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-medium">
              بيانات الفرصة
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field
                name="title"
                label="عنوان الفرصة"
                required
              />

              <SelectField
                name="opportunity_type"
                label="نوع الفرصة"
                options={[
                  ["model", "مودل"],
                  ["actor", "ممثل"],
                ]}
              />

              <Field
                name="city_ar"
                label="المدينة بالعربية"
              />

              <Field
                name="city_en"
                label="المدينة بالإنجليزية"
              />

              <Field
                name="city_slug"
                label="City Slug"
                placeholder="riyadh"
              />

              <SelectField
                name="required_gender"
                label="الجنس المطلوب"
                options={[
                  ["any", "أي جنس"],
                  ["male", "ذكر"],
                  ["female", "أنثى"],
                ]}
              />

              <Field
                name="min_age"
                label="الحد الأدنى للعمر"
                type="number"
              />

              <Field
                name="max_age"
                label="الحد الأعلى للعمر"
                type="number"
              />

              <Field
                name="required_count"
                label="العدد المطلوب"
                type="number"
              />

              <SelectField
                name="posting_mode"
                label="نمط الفرصة"
                options={[
                  ["project", "Project"],
                  ["quick", "Quick"],
                ]}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-white/60">
                الوصف
              </label>

              <textarea
                name="description"
                required
                rows={7}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-[#c8a45d]/50"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-medium">
              المقابل والمواعيد
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SelectField
                name="compensation_type"
                label="نوع المقابل"
                options={[
                  ["fixed", "مبلغ ثابت"],
                  ["negotiable", "حسب الاتفاق"],
                  ["unpaid", "غير مدفوع"],
                ]}
              />

              <Field
                name="budget"
                label="الميزانية"
              />

              <Field
                name="application_start_date"
                label="بداية التقديم"
                type="date"
              />

              <Field
                name="application_deadline"
                label="نهاية التقديم"
                type="date"
              />

              <Field
                name="application_days"
                label="مدة استقبال الطلبات بالأيام"
                type="number"
              />

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
              />
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
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
              className="rounded-full bg-[#c8a45d] px-7 py-3 text-sm font-medium text-black transition hover:opacity-90"
            >
              نشر الآن
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-[#c8a45d]/50"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">
        {label}
      </span>

      <select
        name={name}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none transition focus:border-[#c8a45d]/50"
      >
        {options.map(([value, text]) => (
          <option
            key={value}
            value={value}
          >
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}