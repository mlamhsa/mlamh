import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePublisher } from "@/lib/auth/require-publisher";
import PublisherVerificationForm from "@/components/publisher/PublisherVerificationForm";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PublisherVerificationPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";
  const { publisher, profile } = await requirePublisher(locale);

  if (publisher.publisher_type === "individual") {
    redirect(`/${locale}/publisher-dashboard/profile`);
  }

  if (String(profile.approval_status ?? "not_submitted").toLowerCase() !== "approved") {
    redirect(`/${locale}/publisher-dashboard/profile`);
  }

  const verificationStatus = publisher.verification_status ?? "unverified";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">
            {isRtl ? "توثيق الجهة" : "Organization Verification"}
          </p>
          <h1 className="mt-4 text-4xl font-light sm:text-5xl">
            {isRtl ? "أثبت ارتباطك بالجهة" : "Verify Your Organization"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            {isRtl
              ? "اختر طريقة واحدة للتوثيق. التوثيق اختياري ومنفصل عن اعتماد الحساب، لكنه يضيف طبقة ثقة إضافية للمواهب."
              : "Choose one verification method. Verification is optional and separate from account approval, but adds an extra trust layer for talent."}
          </p>
        </div>

        {verificationStatus === "verified" ? (
          <section className="rounded-[2rem] border border-emerald-400/25 bg-emerald-400/[0.06] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              {isRtl ? "الحالة" : "Status"}
            </p>
            <h2 className="mt-3 text-2xl font-light text-white">
              {isRtl ? "جهتك موثقة ✓" : "Your Organization Is Verified ✓"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {isRtl
                ? "تم التحقق من ارتباط حسابك بهذه الجهة."
                : "Your connection to this organization has been verified."}
            </p>
          </section>
        ) : verificationStatus === "pending" ? (
          <section className="rounded-[2rem] border border-amber-400/25 bg-amber-400/[0.06] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200">
              {isRtl ? "الحالة" : "Status"}
            </p>
            <h2 className="mt-3 text-2xl font-light text-white">
              {isRtl ? "طلبك قيد المراجعة" : "Your Request Is Under Review"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              {isRtl
                ? "استلمنا طلب التوثيق وسيقوم فريق ملامح بمراجعته."
                : "We received your verification request and the MLAMH team will review it."}
            </p>
          </section>
        ) : (
          <>
            {verificationStatus === "rejected" ? (
              <section className="mb-8 rounded-[2rem] border border-red-400/20 bg-red-400/[0.06] p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-red-300">
                  {isRtl ? "حالة التوثيق" : "Verification Status"}
                </p>
                <h2 className="mt-3 text-2xl font-light text-white">
                  {isRtl ? "تعذر اعتماد طلب التوثيق" : "Verification Request Rejected"}
                </h2>
                {publisher.verification_rejection_reason ? (
                  <p className="mt-3 text-sm leading-7 text-red-100">
                    {publisher.verification_rejection_reason}
                  </p>
                ) : null}
              </section>
            ) : null}

            <PublisherVerificationForm
              locale={locale}
              defaultEmail={publisher.verification_email}
              isRejected={verificationStatus === "rejected"}
            />
          </>
        )}

        <div className="mt-10">
          <Link
            href={`/${locale}/publisher-dashboard/profile`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            {isRtl ? "العودة إلى ملف الجهة" : "Back to Organization Profile"}
          </Link>
        </div>
      </div>
    </main>
  );
}
