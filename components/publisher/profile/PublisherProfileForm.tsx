"use client";

import Link from "next/link";

import {
  submitPublisherProfileForReviewAction,
  updatePublisherProfileAction,
} from "@/lib/actions/update-publisher-profile";
import PublisherImageUploadFields from "@/components/publisher/PublisherImageUploadFields";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

const PUBLISHER_TYPE_OPTIONS = [
  { value: "production_company", ar: "شركة إنتاج", en: "Production Company" },
  { value: "advertising_agency", ar: "وكالة إعلانية", en: "Advertising Agency" },
  { value: "casting_agency", ar: "وكالة كاستينغ", en: "Casting Agency" },
  { value: "talent_agency", ar: "وكالة مواهب", en: "Talent Agency" },
  { value: "brand", ar: "علامة تجارية", en: "Brand" },
  { value: "content_company", ar: "شركة محتوى", en: "Content Company" },
  { value: "individual", ar: "فرد / صاحب مشروع", en: "Individual / Small Business" },
  { value: "other", ar: "أخرى", en: "Other" },
] as const;

type PublisherData = {
  company_name: string | null;
  contact_name: string | null;
  publisher_type: string | null;
  city: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  verified: boolean | null;
  status: string | null;
  verification_status: string | null;
  verification_method: string | null;
  verification_email: string | null;
  verification_document_url: string | null;
  verification_submitted_at: string | null;
  verification_reviewed_at: string | null;
};

type PublisherProfileFormProps = {
  locale: string;
  isRtl: boolean;
  approvalStatus: string;
  publisher: PublisherData;
};

export default function PublisherProfileForm({
  locale,
  isRtl,
  approvalStatus,
  publisher,
}: PublisherProfileFormProps) {
  const isIndividual = publisher.publisher_type === "individual";
  const isProfilePending =
    approvalStatus === "pending" || approvalStatus === "submitted";
  const isProfileApproved = approvalStatus === "approved";
  const isProfileRejected =
    approvalStatus === "rejected" || approvalStatus === "changes_requested";

  const selectedCity = resolveCityValue(publisher.city);
  const publisherTypeLabel =
    PUBLISHER_TYPE_OPTIONS.find(
      (item) => item.value === publisher.publisher_type,
    )?.[isRtl ? "ar" : "en"] ??
    publisher.publisher_type ??
    (isRtl ? "غير محدد" : "Not specified");

  const requirements = isIndividual
    ? [
        {
          key: "contact_name",
          complete: Boolean(publisher.contact_name?.trim()),
          label: isRtl ? "الاسم" : "Name",
        },
        {
          key: "publisher_type",
          complete: publisher.publisher_type === "individual",
          label: isRtl ? "نوع الحساب" : "Account type",
        },
        {
          key: "city",
          complete: Boolean(publisher.city?.trim()),
          label: isRtl ? "المدينة" : "City",
        },
      ]
    : [
        {
          key: "company_name",
          complete: Boolean(publisher.company_name?.trim()),
          label: isRtl ? "اسم الجهة" : "Organization name",
        },
        {
          key: "contact_name",
          complete: Boolean(publisher.contact_name?.trim()),
          label: isRtl ? "اسم مسؤول الحساب" : "Account manager",
        },
        {
          key: "publisher_type",
          complete: Boolean(publisher.publisher_type?.trim()),
          label: isRtl ? "نوع الجهة" : "Organization type",
        },
        {
          key: "city",
          complete: Boolean(publisher.city?.trim()),
          label: isRtl ? "المدينة" : "City",
        },
        {
          key: "profile_image_url",
          complete: Boolean(publisher.profile_image_url?.trim()),
          label: isRtl ? "شعار الجهة" : "Organization logo",
        },
      ];

  const completedRequirements = requirements.filter(
    (item) => item.complete,
  ).length;
  const isReviewReady = completedRequirements === requirements.length;

  return (
    <form action={updatePublisherProfileAction} className="grid gap-6 sm:gap-8">
      <input type="hidden" name="locale" value={locale} />

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 md:p-8">
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">
            {isIndividual
              ? isRtl
                ? "حساب فرد / صاحب مشروع"
                : "Individual / Small Business"
              : isRtl
                ? "هوية الجهة"
                : "Organization Identity"}
          </p>
          <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
            {isIndividual
              ? isRtl
                ? "بياناتك الأساسية"
                : "Your Basic Details"
              : isRtl
                ? "بيانات الجهة الأساسية"
                : "Organization Details"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
            {isIndividual
              ? isRtl
                ? "هذا المسار مناسب لأصحاب المتاجر والصالونات والمصورين ومنظمي الفعاليات والمشاريع الصغيرة الذين يريدون نشر فرص سريعة والوصول إلى المواهب بسهولة."
                : "Designed for shop owners, salons, photographers, event organizers, and small businesses that want to post quick opportunities and reach talent easily."
              : isRtl
                ? "أضف المعلومات التي تساعد المواهب على معرفة الجهة والثقة بالفرص التي تنشرها."
                : "Add the essential information talent needs to recognize and trust your organization."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {isIndividual ? (
            <>
              <Field
                label={isRtl ? "الاسم" : "Name"}
                name="contact_name"
                defaultValue={publisher.contact_name ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
                placeholder={isRtl ? "مثال: أسامة عياش" : "e.g. Osama Ayyash"}
                required
              />

              <Field
                label={
                  isRtl
                    ? "اسم النشاط أو المشروع (اختياري)"
                    : "Business or Project Name (Optional)"
                }
                name="company_name"
                defaultValue={publisher.company_name ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
                placeholder={
                  isRtl ? "مثال: متجر لمسة" : "e.g. Lamsa Store"
                }
              />
            </>
          ) : (
            <>
              <Field
                label={isRtl ? "اسم الجهة" : "Organization Name"}
                name="company_name"
                defaultValue={publisher.company_name ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
                placeholder={
                  isRtl ? "مثال: وكالة ملامح" : "e.g. MLAMH Agency"
                }
                required
              />

              <Field
                label={isRtl ? "اسم مسؤول الحساب" : "Account Manager Name"}
                name="contact_name"
                defaultValue={publisher.contact_name ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
                placeholder={
                  isRtl ? "اسم الشخص المسؤول عن الحساب" : "Account manager name"
                }
                required
              />
            </>
          )}

          <div>
            <label className="mb-2.5 block text-sm font-medium text-white/65">
              {isIndividual
                ? isRtl
                  ? "نوع الحساب"
                  : "Account Type"
                : isRtl
                  ? "نوع الجهة"
                  : "Organization Type"}
            </label>
            <div className="inline-flex min-h-12 items-center rounded-full border border-gold/20 bg-gold/[0.06] px-5 text-sm text-gold">
              {publisherTypeLabel}
            </div>
            <input
              type="hidden"
              name="publisher_type"
              value={publisher.publisher_type ?? ""}
            />
          </div>

          <div>
            <label className="mb-2.5 block text-sm font-medium text-white/65">
              {isRtl ? "المدينة" : "City"}
              <span className="ms-1 text-gold">*</span>
            </label>
            <select
              name="city"
              defaultValue={selectedCity || publisher.city || ""}
              required
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm text-white outline-none transition hover:border-white/15 focus:border-gold/45 focus:ring-4 focus:ring-gold/[0.06]"
            >
              <option value="" disabled>
                {isRtl ? "اختر المدينة" : "Select city"}
              </option>
              {publisher.city && !selectedCity ? (
                <option value={publisher.city}>{publisher.city}</option>
              ) : null}
              {SAUDI_CITIES.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {isRtl ? city.ar : city.en}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label={
                isIndividual
                  ? isRtl
                    ? "نبذة قصيرة (اختياري)"
                    : "Short Introduction (Optional)"
                  : isRtl
                    ? "نبذة عن الجهة (اختياري)"
                    : "Organization Description (Optional)"
              }
              name="description"
              defaultValue={publisher.description ?? ""}
              dir={isRtl ? "rtl" : "ltr"}
              placeholder={
                isIndividual
                  ? isRtl
                    ? "مثال: متجر أزياء في الرياض ونبحث بشكل متكرر عن مودلز للتصوير."
                    : "e.g. Riyadh fashion store regularly booking models for shoots."
                  : isRtl
                    ? "اكتب وصفًا مختصرًا عن الجهة ونوع الأعمال التي تنشرها."
                    : "Write a short description of the organization and the work you publish."
              }
            />
          </div>
        </div>
      </section>

      <PublisherImageUploadFields
        isRtl={isRtl}
        isIndividual={isIndividual}
        currentProfileImageUrl={publisher.profile_image_url}
      />

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 md:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-gold">
            {isRtl ? "معلومات التواصل" : "Contact Information"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/40">
            {isRtl
              ? "احتفظنا فقط بالمعلومات العملية التي تحتاجها المنصة للتواصل والثقة."
              : "Only the practical contact details needed for communication and trust are kept here."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field
            label={isRtl ? "رقم التواصل" : "Phone"}
            name="phone"
            defaultValue={publisher.phone ?? ""}
            type="tel"
            dir="ltr"
            placeholder={isRtl ? "مثال: 0551234567" : "Example: +966551234567"}
          />
          <Field
            label={isRtl ? "البريد الإلكتروني" : "Email"}
            name="email"
            defaultValue={publisher.email ?? ""}
            type="email"
            dir="ltr"
            placeholder="name@example.com"
          />
          {!isIndividual ? (
            <Field
              label={isRtl ? "الموقع الإلكتروني (اختياري)" : "Website (Optional)"}
              name="website"
              defaultValue={publisher.website ?? ""}
              type="url"
              dir="ltr"
              placeholder="https://example.com"
            />
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/[0.07] bg-white/[0.018] p-5 sm:p-6 md:p-8">
        <div className="grid gap-7 lg:grid-cols-[1.2fr_0.9fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              {isRtl ? "حالة الحساب" : "Account Status"}
            </p>
            <h2 className="mt-3 text-2xl font-light text-white">
              {isProfileApproved
                ? isRtl
                  ? "الحساب معتمد ✓"
                  : "Account Approved ✓"
                : isProfilePending
                  ? isRtl
                    ? "الملف قيد المراجعة"
                    : "Profile Under Review"
                  : isProfileRejected
                    ? isRtl
                      ? "يحتاج الملف إلى تحديث"
                      : "Profile Needs Updates"
                    : isReviewReady
                      ? isIndividual
                        ? isRtl
                          ? "الحساب جاهز للتفعيل"
                          : "Account Ready to Activate"
                        : isRtl
                          ? "ملف الجهة جاهز للمراجعة"
                          : "Organization Ready for Review"
                      : isRtl
                        ? "أكمل البيانات المطلوبة"
                        : "Complete Required Details"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
              {isProfileApproved
                ? isRtl
                  ? "تم اعتماد حسابك ويمكنك استخدام صلاحيات الناشر المتاحة ونشر الفرص."
                  : "Your account is approved and you can use publisher features and post opportunities."
                : isProfilePending
                  ? isRtl
                    ? "استلم فريق ملامح ملف الجهة ويقوم بمراجعته الآن."
                    : "MLAMH has received the organization profile and is reviewing it."
                  : isProfileRejected
                    ? isRtl
                      ? "حدّث البيانات المطلوبة ثم أعد إرسال ملف الجهة للمراجعة."
                      : "Update the requested details, then resubmit the organization profile."
                    : isReviewReady
                      ? isIndividual
                        ? isRtl
                          ? "اكتملت البيانات الأساسية. فعّل الحساب وابدأ بنشر الفرص السريعة مباشرة."
                          : "Your essential details are complete. Activate the account and start posting quick opportunities."
                        : isRtl
                          ? "اكتملت البيانات الأساسية ويمكنك إرسال ملف الجهة للمراجعة."
                          : "The organization details are complete and ready for review."
                      : isRtl
                        ? "أكمل العناصر الناقصة ثم احفظ التغييرات."
                        : "Complete the missing items, then save your changes."}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs text-white/45">
                {isRtl ? "الجاهزية" : "Readiness"}
              </span>
              <span className="text-xs text-gold">
                {completedRequirements}/{requirements.length}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {requirements.map((requirement) => (
                <div key={requirement.key} className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      requirement.complete ? "text-emerald-300" : "text-white/25"
                    }
                  >
                    {requirement.complete ? "✓" : "○"}
                  </span>
                  <span
                    className={
                      requirement.complete ? "text-white/60" : "text-white/35"
                    }
                  >
                    {requirement.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] px-6 text-sm font-medium text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "حفظ التغييرات" : "Save Changes"}
            </button>

            {!isProfileApproved && !isProfilePending && isReviewReady ? (
              <button
                type="submit"
                formAction={submitPublisherProfileForReviewAction}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft"
              >
                {isIndividual
                  ? isRtl
                    ? "تفعيل الحساب"
                    : "Activate Account"
                  : isProfileRejected
                    ? isRtl
                      ? "إعادة الإرسال للمراجعة"
                      : "Resubmit for Review"
                    : isRtl
                      ? "إرسال للمراجعة"
                      : "Submit for Review"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {!isIndividual ? (
        <section className="rounded-[2rem] border border-gold/15 bg-gold/[0.025] p-5 sm:p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium text-gold">
                  {isRtl ? "توثيق الجهة" : "Organization Verification"}
                </p>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] text-white/40">
                  {isRtl ? "اختياري" : "Optional"}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-light text-white">
                {publisher.verification_status === "verified"
                  ? isRtl
                    ? "جهتك موثقة ✓"
                    : "Organization Verified ✓"
                  : publisher.verification_status === "pending"
                    ? isRtl
                      ? "طلب التوثيق قيد المراجعة"
                      : "Verification Under Review"
                    : isRtl
                      ? "احصل على شارة الجهة الموثقة"
                      : "Get the Verified Organization Badge"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                {isRtl
                  ? "التوثيق منفصل عن اعتماد الحساب. يثبت ارتباطك بالجهة ويضيف طبقة ثقة إضافية للمواهب."
                  : "Verification is separate from account approval. It confirms your relationship with the organization and adds an extra trust layer for talent."}
              </p>
            </div>

            {publisher.verification_status === "verified" ? (
              <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 text-sm text-emerald-300">
                {isRtl ? "موثقة ✓" : "Verified ✓"}
              </span>
            ) : publisher.verification_status === "pending" ? (
              <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10 px-5 text-sm text-amber-200">
                {isRtl ? "قيد المراجعة" : "Under Review"}
              </span>
            ) : isProfileApproved ? (
              <Link
                href={`/${locale}/publisher-dashboard/verification`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] px-6 text-sm text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "بدء التوثيق" : "Start Verification"}
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm text-white/35">
                {isRtl ? "متاح بعد اعتماد الحساب" : "Available After Approval"}
              </span>
            )}
          </div>
        </section>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  dir,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-white/65">
        {label}
        {required ? <span className="ms-1 text-gold">*</span> : null}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        dir={dir}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/15 focus:border-gold/45 focus:ring-4 focus:ring-gold/[0.06]"
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
  dir,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  dir?: "rtl" | "ltr";
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-white/65">
        {label}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        dir={dir}
        placeholder={placeholder}
        className="min-h-28 w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-4 text-[15px] leading-7 text-white outline-none transition placeholder:text-white/25 hover:border-white/15 focus:border-gold/45 focus:ring-4 focus:ring-gold/[0.06]"
      />
    </div>
  );
}

function resolveCityValue(value: string | null | undefined) {
  const normalizedValue = value?.trim().toLocaleLowerCase();

  if (!normalizedValue) return "";

  const city = SAUDI_CITIES.find(
    (item) =>
      item.slug.toLocaleLowerCase() === normalizedValue ||
      item.ar.toLocaleLowerCase() === normalizedValue ||
      item.en.toLocaleLowerCase() === normalizedValue,
  );

  return city?.slug ?? "";
}
