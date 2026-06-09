import Link from "next/link";
import { updatePublisherProfileAction } from "@/lib/actions/update-publisher-profile";
import { requirePublisher } from "@/lib/auth/require-publisher";
import PublisherImageUploadFields from "@/components/publisher/PublisherImageUploadFields";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
  }>;
};

export default async function PublisherProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isRtl = locale === "ar";
  const saved = resolvedSearchParams.saved === "1";

  const { publisher } = await requirePublisher(locale);

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className={isRtl ? "text-right" : "text-left"}>
            <p className="text-xs uppercase tracking-[0.4em] text-gold">
              {isRtl ? "ملف الناشر" : "Publisher Profile"}
            </p>

            <h1 className="mt-4 text-5xl font-light">
              {isRtl ? "تعديل ملف الناشر" : "Edit Publisher Profile"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
              {isRtl
                ? "حدّث بيانات الجهة ومعلومات التواصل والروابط الاجتماعية."
                : "Update your publisher details, contact information, and social links."}
            </p>
          </div>

          <Link
            href={`/${locale}/publisher-dashboard`}
            className="inline-flex border border-white/15 px-6 py-3 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/50 hover:text-gold"
          >
            {isRtl ? "العودة للوحة" : "Back to Dashboard"}
          </Link>
        </div>

        {saved ? (
          <div className="mb-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {isRtl
              ? "تم حفظ التغييرات بنجاح."
              : "Changes saved successfully."}
          </div>
        ) : null}

        <form action={updatePublisherProfileAction} className="grid gap-8">
          <input type="hidden" name="locale" value={locale} />

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "المعلومات الأساسية" : "Basic Information"}
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label={isRtl ? "اسم الجهة" : "Company Name"}
                name="company_name"
                defaultValue={publisher.company_name ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
              />

              <Field
                label={isRtl ? "اسم المسؤول" : "Contact Name"}
                name="contact_name"
                defaultValue={publisher.contact_name ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
              />

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
                  {isRtl ? "نوع الناشر" : "Publisher Type"}
                </label>

                <select
                  name="publisher_type"
                  defaultValue={publisher.publisher_type ?? ""}
                  className="w-full border border-white/10 bg-black/30 px-4 py-4 text-white outline-none focus:border-gold/50"
                >
                  <option value="individual">
                    {isRtl ? "فرد" : "Individual"}
                  </option>
                  <option value="salon">{isRtl ? "صالون" : "Salon"}</option>
                  <option value="store">{isRtl ? "متجر" : "Store"}</option>
                  <option value="agency">{isRtl ? "وكالة" : "Agency"}</option>
                  <option value="production_company">
                    {isRtl ? "شركة إنتاج" : "Production Company"}
                  </option>
                  <option value="brand">{isRtl ? "براند" : "Brand"}</option>
                  <option value="photographer">
                    {isRtl ? "مصور" : "Photographer"}
                  </option>
                  <option value="marketer">
                    {isRtl ? "مسوق" : "Marketer"}
                  </option>
                  <option value="other">{isRtl ? "أخرى" : "Other"}</option>
                </select>
              </div>

              <Field
                label={isRtl ? "المدينة" : "City"}
                name="city"
                defaultValue={publisher.city ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
              />

              <Field
                label={isRtl ? "حجم الشركة" : "Company Size"}
                name="company_size"
                defaultValue={publisher.company_size ?? ""}
                placeholder={isRtl ? "مثال: 1-10" : "Example: 1-10"}
                dir="ltr"
              />

              <Field
                label={isRtl ? "سنة التأسيس" : "Founded Year"}
                name="founded_year"
                type="number"
                defaultValue={publisher.founded_year?.toString() ?? ""}
                placeholder="2020"
                dir="ltr"
              />

              <div className="md:col-span-2">
                <Textarea
                  label={isRtl ? "نبذة عن الجهة" : "Company Description"}
                  name="description"
                  defaultValue={publisher.description ?? ""}
                  dir={isRtl ? "rtl" : "ltr"}
                  placeholder={
                    isRtl
                      ? "اكتب وصفًا مختصرًا عن الجهة ونوع الأعمال التي تنشرها."
                      : "Write a short description about your company and the kind of opportunities you publish."
                  }
                />
              </div>
            </div>
          </section>

          <PublisherImageUploadFields
            isRtl={isRtl}
            currentProfileImageUrl={publisher.profile_image_url}
            currentCoverImageUrl={publisher.cover_image_url}
          />

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "معلومات التواصل" : "Contact Information"}
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label={isRtl ? "رقم التواصل" : "Phone"}
                name="phone"
                defaultValue={publisher.phone ?? ""}
                type="tel"
                dir="ltr"
              />

              <Field
                label={isRtl ? "البريد الإلكتروني" : "Email"}
                name="email"
                defaultValue={publisher.email ?? ""}
                type="email"
                dir="ltr"
              />

              <Field
                label={isRtl ? "الموقع الإلكتروني" : "Website"}
                name="website"
                defaultValue={publisher.website ?? ""}
                type="url"
                dir="ltr"
              />

              <Field
                label={isRtl ? "العنوان" : "Address"}
                name="address"
                defaultValue={publisher.address ?? ""}
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "روابط التواصل" : "Social Links"}
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Instagram"
                name="instagram"
                defaultValue={publisher.instagram ?? ""}
                type="url"
                dir="ltr"
              />

              <Field
                label="TikTok"
                name="tiktok_url"
                defaultValue={publisher.tiktok_url ?? ""}
                type="url"
                dir="ltr"
              />

              <Field
                label="Snapchat"
                name="snapchat_url"
                defaultValue={publisher.snapchat_url ?? ""}
                type="url"
                dir="ltr"
              />

              <Field
                label="LinkedIn"
                name="linkedin_url"
                defaultValue={publisher.linkedin_url ?? ""}
                type="url"
                dir="ltr"
              />
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="flex-1 border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.25em] text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "حفظ التغييرات" : "Save Changes"}
            </button>

            <Link
              href={`/${locale}/publisher-dashboard`}
              className="flex-1 border border-white/15 px-6 py-4 text-center text-xs uppercase tracking-[0.25em] text-white/60 transition hover:border-white hover:text-white"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  dir,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  dir?: "rtl" | "ltr";
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </label>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        dir={dir}
        placeholder={placeholder}
        className="w-full border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
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
      <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </label>

      <textarea
        name={name}
        defaultValue={defaultValue}
        dir={dir}
        placeholder={placeholder}
        className="min-h-36 w-full border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
      />
    </div>
  );
}