import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { createPublisherProfileAction } from "@/lib/actions/create-publisher-profile";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Register Publisher — MLAMH",
  robots: { index: false, follow: false },
};

const publisherTypes = [
  { value: "individual", ar: "فرد", en: "Individual" },
  { value: "salon", ar: "صالون", en: "Salon" },
  { value: "store", ar: "متجر", en: "Store" },
  { value: "agency", ar: "وكالة", en: "Agency" },
  { value: "production_company", ar: "شركة إنتاج", en: "Production Company" },
  { value: "brand", ar: "براند", en: "Brand" },
  { value: "photographer", ar: "مصور", en: "Photographer" },
  { value: "marketer", ar: "مسوق", en: "Marketer" },
  { value: "other", ar: "أخرى", en: "Other" },
];

export default async function RegisterPublisherPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";

  return (
    <main className="relative z-[2] bg-background">
      <Navbar dict={dict} locale={locale} />

      <section className="min-h-screen px-6 pt-32 pb-20 text-white">
        <div className="mx-auto max-w-3xl">
          <header className={isRtl ? "mb-12 text-right" : "mb-12 text-left"}>
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH PUBLISHER
            </p>

            <h1
              className="text-4xl font-light md:text-6xl"
              style={{
                fontFamily: isRtl
                  ? "var(--font-noto-arabic)"
                  : "var(--font-cormorant)",
              }}
            >
              {isRtl ? "أنشئ حساب ناشر فرص" : "Create Publisher Account"}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-muted">
              {isRtl
                ? "سجّل كجهة تبحث عن موهبة لنشر الفرص واستقبال المتقدمين من المواهب داخل MLAMH."
                : "Register as an opportunity publisher to post opportunities and receive talent applications on MLAMH."}
            </p>
          </header>

          <form
            action={createPublisherProfileAction}
            className={isRtl ? "text-right" : "text-left"}
          >
            {/* Email + Password */}
            <div className="mb-10 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label={isRtl ? "البريد الإلكتروني" : "Email"}
                  name="email"
                  type="email"
                  required
                  dir="ltr"
                  placeholder="publisher@example.com"
                />
                <Field
                  label={isRtl ? "كلمة المرور" : "Password"}
                  name="password"
                  type="password"
                  required
                  dir="ltr"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Publisher Data */}
            <div className="mb-10 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label={isRtl ? "اسم المسؤول" : "Contact Name"}
                  name="contact_name"
                  required
                  dir={isRtl ? "rtl" : "ltr"}
                  placeholder={isRtl ? "مثال: سارة أحمد" : "e.g. Sarah Ahmed"}
                />
                <Field
                  label={isRtl ? "رقم التواصل" : "Phone"}
                  name="phone"
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="+9665xxxxxxxx"
                />
                <Field
                  label={isRtl ? "اسم الجهة / النشاط" : "Business / Display Name"}
                  name="company_name"
                  dir={isRtl ? "rtl" : "ltr"}
                  placeholder={isRtl ? "مثال: صالون سارة" : "e.g. Sarah Salon"}
                />
                <Field
                  label={isRtl ? "المدينة" : "City"}
                  name="city"
                  dir={isRtl ? "rtl" : "ltr"}
                  placeholder={isRtl ? "الرياض" : "Riyadh"}
                />
                <div className="md:col-span-2">
                  <label
                    htmlFor="publisher_type"
                    className="mb-2 block text-[9px] uppercase tracking-[0.35em] text-gray-muted"
                  >
                    {isRtl ? "نوع الناشر" : "Publisher Type"} <span className="text-gold">*</span>
                  </label>
                  <select
                    id="publisher_type"
                    name="publisher_type"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled hidden>
                      {isRtl ? "اختر النوع" : "Select type"}
                    </option>
                    {publisherTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {isRtl ? type.ar : type.en}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-muted">
                    {isRtl ? "إذا اخترت أخرى، اكتب نوع الجهة في الحقل التالي."
                    : "If you choose Other, describe your publisher type below."}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Field
                    label={isRtl ? "إذا اخترت أخرى، من أنت؟" : "If Other, who are you?"}
                    name="publisher_type_other"
                    dir={isRtl ? "rtl" : "ltr"}
                    placeholder={isRtl ? "مثال: خبيرة تجميل مستقلة" : "e.g. Freelance makeup artist"}
                  />
                </div>
                <Field label="Instagram" name="instagram" type="url" dir="ltr" placeholder="https://instagram.com/username" />
                <Field label={isRtl ? "الموقع الإلكتروني" : "Website"} name="website" type="url" dir="ltr" placeholder="https://example.com" />
              </div>
            </div>

            <div className={`flex flex-col gap-4 sm:flex-row ${isRtl ? "sm:flex-row-reverse" : ""}`}>
              <button
                type="submit"
                className="btn-luxury border border-gold/40 bg-gold/[0.06] px-8 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition hover:border-gold hover:bg-gold/15"
              >
                {isRtl ? "إنشاء الحساب" : "Create Account"}
              </button>

              <Link
                href={`/${locale}/join`}
                className="inline-flex items-center justify-center border border-white/10 px-8 py-4 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                {isRtl ? "أنا موهبة" : "I am Talent"}
              </Link>
            </div>
          </form>
        </div>
      </section>

      <Footer dict={dict} locale={locale} />
    </main>
  );
}

function Field({ label, name, type = "text", placeholder, required, dir }: any) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-[9px] uppercase tracking-[0.35em] text-gray-muted">
        {label} {required ? <span className="text-gold">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        dir={dir}
        placeholder={placeholder}
        className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-gold/50"
      />
    </div>
  );
}