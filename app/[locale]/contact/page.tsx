import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "تواصل معنا | ملامح" : "Contact Us | MLAMH",
    description: isArabic
      ? "تواصل مع فريق ملامح للاستفسارات والدعم والشراكات والتعاون."
      : "Contact the MLAMH team for inquiries, support, partnerships, and collaboration.",
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "ar" } = await params;
  const isRtl = locale === "ar";

  const contactMethods = [
    {
      titleAr: "البريد الإلكتروني",
      titleEn: "Email",
      value: "hello@mlamh.com",
      href: "mailto:hello@mlamh.com",
    },
    {
      titleAr: "الشركات والشراكات",
      titleEn: "Companies & Partnerships",
      value: "partners@mlamh.com",
      href: "mailto:partners@mlamh.com",
    },
    {
      titleAr: "الدعم",
      titleEn: "Support",
      value: "support@mlamh.com",
      href: "mailto:support@mlamh.com",
    },
  ];

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
          <div className="relative max-w-3xl">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.28em]"
              }`}
            >
              {isRtl ? "تواصل معنا" : "Contact Us"}
            </p>

            <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
              {isRtl
                ? "يسعدنا أن نسمع منك"
                : "We would love to hear from you"}
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "سواء كان لديك استفسار، اقتراح، طلب دعم، أو رغبة في التعاون، يمكنك التواصل مع فريق ملامح من خلال القنوات التالية."
                : "Whether you have a question, suggestion, support request, or partnership inquiry, you can reach the MLAMH team through the following channels."}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {contactMethods.map((method) => (
            <a
              key={method.value}
              href={method.href}
              className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 transition hover:border-gold/30 hover:bg-gold/[0.04]"
            >
              <p className="text-sm text-white/45">
                {isRtl ? method.titleAr : method.titleEn}
              </p>

              <p
                dir="ltr"
                className={`mt-4 text-lg text-gold ${
                  isRtl ? "text-right" : "text-left"
                }`}
              >
                {method.value}
              </p>
            </a>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "أرسل لنا رسالة" : "Send a message"}
            </p>

            <h2 className="mt-4 text-3xl font-light">
              {isRtl ? "نحن هنا للمساعدة" : "We are here to help"}
            </h2>

            <p className="mt-5 text-sm leading-8 text-white/55">
              {isRtl
                ? "يمكنك مراسلتنا عبر البريد الإلكتروني، وسنحاول الرد في أقرب وقت ممكن."
                : "Send us an email and our team will respond as soon as possible."}
            </p>

            <a
              href="mailto:hello@mlamh.com"
              className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-black transition hover:bg-gold-soft"
            >
              {isRtl ? "إرسال بريد إلكتروني" : "Send an Email"}
            </a>
          </div>

          <div className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "للمواهب والشركات" : "For talent and companies"}
            </p>

            <h2 className="mt-4 text-3xl font-light">
              {isRtl
                ? "ابحث عن الصفحة المناسبة"
                : "Find the right place"}
            </h2>

            <div className="mt-7 space-y-3">
              <Link
                href={`/${locale}/talent`}
                className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 text-sm text-white/70 transition hover:border-gold/30 hover:text-gold"
              >
                <span>{isRtl ? "استعراض المواهب" : "Browse Talent"}</span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>

              <Link
                href={`/${locale}/opportunities`}
                className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 text-sm text-white/70 transition hover:border-gold/30 hover:text-gold"
              >
                <span>
                  {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
                </span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>

              <Link
                href={`/${locale}/publishers`}
                className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 text-sm text-white/70 transition hover:border-gold/30 hover:text-gold"
              >
                <span>{isRtl ? "صفحة الشركات" : "Companies"}</span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}