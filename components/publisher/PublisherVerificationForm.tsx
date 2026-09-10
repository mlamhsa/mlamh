"use client";

import { useState } from "react";
import { submitPublisherVerificationAction } from "@/lib/actions/submit-publisher-verification";

type Method = "company_email" | "official_document" | "business_card";

export default function PublisherVerificationForm({
  locale,
  defaultEmail,
  isRejected,
}: {
  locale: string;
  defaultEmail?: string | null;
  isRejected?: boolean;
}) {
  const isRtl = locale === "ar";
  const [method, setMethod] = useState<Method>("company_email");

  const methods: Array<{
    value: Method;
    title: string;
    description: string;
    recommended?: boolean;
  }> = [
    {
      value: "company_email",
      title: isRtl ? "البريد الرسمي للجهة" : "Official Company Email",
      description: isRtl
        ? "استخدم بريدًا على نطاق الجهة مثل name@company.com."
        : "Use an email on the organization domain, such as name@company.com.",
      recommended: true,
    },
    {
      value: "official_document",
      title: isRtl ? "وثيقة رسمية" : "Official Document",
      description: isRtl
        ? "ارفع سجلًا تجاريًا أو ترخيصًا أو وثيقة رسمية تثبت بيانات الجهة."
        : "Upload a commercial registration, license, or another official organization document.",
    },
    {
      value: "business_card",
      title: isRtl ? "بطاقة عمل" : "Business Card",
      description: isRtl
        ? "ارفع بطاقة عمل توضح اسمك واسم الجهة وبيانات التواصل."
        : "Upload a business card showing your name, organization, and contact details.",
    },
  ];

  return (
    <form action={submitPublisherVerificationAction} className="space-y-7">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="verification_method" value={method} />

      <div className="grid gap-4 md:grid-cols-3">
        {methods.map((item) => {
          const selected = method === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setMethod(item.value)}
              aria-pressed={selected}
              className={`relative min-h-48 rounded-[2rem] border p-6 text-start transition ${
                selected
                  ? "border-gold bg-gold/[0.07] ring-1 ring-gold/30"
                  : "border-white/10 bg-white/[0.025] hover:border-gold/30"
              }`}
            >
              {item.recommended ? (
                <span className="absolute end-5 top-5 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[10px] text-gold">
                  {isRtl ? "موصى به" : "Recommended"}
                </span>
              ) : null}
              <div className="pt-8">
                <div className={`mb-4 flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-gold bg-gold text-black" : "border-white/20 text-transparent"}`}>
                  ✓
                </div>
                <h2 className="text-xl font-light text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/45">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        {method === "company_email" ? (
          <div>
            <label className="block text-sm text-white/65">
              {isRtl ? "البريد الرسمي" : "Official Email"}
            </label>
            <input
              type="email"
              name="verification_email"
              defaultValue={defaultEmail ?? ""}
              required
              dir="ltr"
              placeholder="name@company.com"
              className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
            />
            <p className="mt-3 text-xs leading-6 text-white/35">
              {isRtl
                ? "لا نقبل Gmail أو Hotmail أو مزودي البريد الشخصي العام."
                : "Gmail, Hotmail, and other public personal email providers are not accepted."}
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-white/65">
              {method === "official_document"
                ? isRtl ? "رفع الوثيقة الرسمية" : "Upload Official Document"
                : isRtl ? "رفع بطاقة العمل" : "Upload Business Card"}
            </label>
            <input
              type="file"
              name="verification_document"
              required
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="mt-3 block w-full rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-sm text-white/55 file:me-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
            />
            <p className="mt-3 text-xs leading-6 text-white/35">
              {isRtl
                ? "PDF أو JPG أو PNG أو WEBP — بحد أقصى 10 ميجابايت."
                : "PDF, JPG, PNG or WEBP — maximum 10 MB."}
            </p>
          </div>
        )}
      </section>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-7 text-sm font-medium text-black transition hover:bg-gold-soft sm:w-auto"
      >
        {isRejected
          ? isRtl ? "إعادة إرسال طلب التوثيق" : "Resubmit Verification Request"
          : isRtl ? "إرسال طلب التوثيق" : "Submit Verification Request"}
      </button>
    </form>
  );
}
