import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Headphones, ShieldCheck } from "lucide-react";

import { createSupportTicketAction } from "@/lib/actions/create-support-ticket";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "الدعم والتواصل | ملامح" : "Support & Contact | MLAMH",
    description: isArabic
      ? "تواصل مع فريق ملامح عبر نظام الدعم والاستفسارات والشراكات."
      : "Contact MLAMH through the support center for help, inquiries, and partnerships.",
  };
}

type PageProps = {
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{
    support_sent?: string;
    support_error?: string;
    ticket?: string;
  }>;
};

const categories = [
  ["general_inquiry", "استفسار عام", "General inquiry"],
  ["technical_issue", "مشكلة تقنية", "Technical issue"],
  ["account_issue", "مشكلة في الحساب", "Account issue"],
  ["opportunity_issue", "مشكلة في فرصة", "Opportunity issue"],
  ["complaint", "شكوى", "Complaint"],
  ["suggestion", "اقتراح", "Suggestion"],
  ["partnership", "شراكة أو تعاون", "Partnership"],
  ["investment", "استثمار", "Investment"],
  ["report", "بلاغ", "Report"],
  ["other", "أخرى", "Other"],
] as const;

export default async function ContactPage({ params, searchParams }: PageProps) {
  const [{ locale = "ar" }, query] = await Promise.all([params, searchParams]);
  const isRtl = locale === "ar";
  const sent = query.support_sent === "1";
  const ticketNumber = query.ticket?.trim() || "";
  const errorCode = query.support_error;

  const errorMessage =
    errorCode === "rate_limit"
      ? isRtl
        ? "تم إرسال عدة طلبات خلال وقت قصير. حاول مرة أخرى بعد قليل."
        : "Too many requests were sent in a short period. Please try again later."
      : errorCode
        ? isRtl
          ? "تعذر إرسال الطلب. تحقق من البيانات وحاول مرة أخرى."
          : "Unable to send your request. Check the details and try again."
        : null;

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-28 text-white sm:px-8 sm:pt-36 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-5 py-9 sm:rounded-[2.5rem] sm:px-10 sm:py-14 lg:px-16">
          <div className="relative max-w-3xl">
            <div className="flex items-center gap-2 text-gold">
              <Headphones className="h-4 w-4" />
              <p className="text-xs">{isRtl ? "الدعم والتواصل" : "Support & Contact"}</p>
            </div>

            <h1 className="mt-4 text-3xl font-light leading-tight sm:text-5xl lg:text-6xl">
              {isRtl ? "كيف يمكننا مساعدتك؟" : "How can we help?"}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/55 sm:text-base">
              {isRtl
                ? "أرسل طلبك مباشرة إلى فريق ملامح. ستحصل على رقم تذكرة لمتابعة الاستفسار أو المشكلة أو طلب الشراكة."
                : "Send your request directly to the MLAMH team. You'll receive a ticket number for support, inquiries, or partnership requests."}
            </p>
          </div>
        </section>

        {sent ? (
          <section className="mt-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/[0.06] p-6 text-center sm:p-8">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" />
            <h2 className="mt-4 text-2xl font-light">
              {isRtl ? "تم إرسال طلبك بنجاح" : "Your request was sent"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              {isRtl
                ? "احتفظ برقم التذكرة. سيستخدمه فريق الدعم للرجوع إلى طلبك."
                : "Keep your ticket number. The support team will use it to reference your request."}
            </p>
            {ticketNumber ? (
              <div dir="ltr" className="mx-auto mt-5 w-fit rounded-2xl border border-gold/25 bg-black/30 px-5 py-3 font-mono text-lg text-gold">
                {ticketNumber}
              </div>
            ) : null}
            <Link
              href={`/${locale}/contact`}
              className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:border-gold/30 hover:text-gold"
            >
              {isRtl ? "إرسال طلب آخر" : "Send another request"}
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8">
              <p className="text-xs text-gold">{isRtl ? "فتح تذكرة دعم" : "Open a support ticket"}</p>
              <h2 className="mt-3 text-2xl font-light sm:text-3xl">
                {isRtl ? "أرسل تفاصيل طلبك" : "Tell us what you need"}
              </h2>

              {errorMessage ? (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              ) : null}

              <form action={createSupportTicketAction} className="mt-6 space-y-4">
                <input type="hidden" name="locale" value={isRtl ? "ar" : "en"} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={isRtl ? "الاسم" : "Name"} name="sender_name" required />
                  <Field label={isRtl ? "البريد الإلكتروني" : "Email"} name="sender_email" type="email" required dir="ltr" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={isRtl ? "رقم الجوال — اختياري" : "Phone — optional"} name="sender_phone" type="tel" dir="ltr" />
                  <label className="block">
                    <span className="mb-2 block text-xs text-white/45">{isRtl ? "نوع الطلب" : "Category"}</span>
                    <select
                      name="category"
                      defaultValue="general_inquiry"
                      className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-gold/40"
                    >
                      {categories.map(([value, ar, en]) => (
                        <option key={value} value={value}>{isRtl ? ar : en}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <Field label={isRtl ? "عنوان الطلب" : "Subject"} name="subject" required />

                <label className="block">
                  <span className="mb-2 block text-xs text-white/45">{isRtl ? "التفاصيل" : "Details"}</span>
                  <textarea
                    name="message"
                    required
                    minLength={1}
                    maxLength={10000}
                    rows={7}
                    className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/20 focus:border-gold/40"
                    placeholder={isRtl ? "اشرح طلبك أو المشكلة بالتفصيل..." : "Describe your request or issue in detail..."}
                  />
                </label>

                <button
                  type="submit"
                  className="min-h-14 w-full rounded-2xl bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft"
                >
                  {isRtl ? "إرسال الطلب" : "Submit request"}
                </button>
              </form>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
                <ShieldCheck className="h-6 w-6 text-gold" />
                <h2 className="mt-4 text-2xl font-light">
                  {isRtl ? "نظام دعم موحّد" : "One support center"}
                </h2>
                <p className="mt-4 text-sm leading-8 text-white/50">
                  {isRtl
                    ? "بدل المراسلات المتفرقة، يتم تسجيل كل طلب كتذكرة داخل ملامح حتى يستطيع فريق الإدارة متابعته والرد عليه."
                    : "Instead of scattered emails, every request is recorded as a MLAMH ticket so the admin team can track and respond to it."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
                <p className="text-xs text-gold">{isRtl ? "هل تبحث عن شيء آخر؟" : "Looking for something else?"}</p>
                <div className="mt-4 space-y-2">
                  <QuickLink href={`/${locale}/talent`} label={isRtl ? "استعراض المواهب" : "Browse talents"} isRtl={isRtl} />
                  <QuickLink href={`/${locale}/opportunities`} label={isRtl ? "استعراض الفرص" : "Browse opportunities"} isRtl={isRtl} />
                  <QuickLink href={`/${locale}/publishers`} label={isRtl ? "الجهات" : "Organizations"} isRtl={isRtl} />
                </div>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-white/45">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        dir={dir}
        className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-gold/40"
      />
    </label>
  );
}

function QuickLink({ href, label, isRtl }: { href: string; label: string; isRtl: boolean }) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 px-4 text-sm text-white/55 transition hover:border-gold/25 hover:text-gold"
    >
      <span>{label}</span>
      <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
    </Link>
  );
}
