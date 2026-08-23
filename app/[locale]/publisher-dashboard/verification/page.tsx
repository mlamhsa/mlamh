import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePublisher } from "@/lib/auth/require-publisher";
import { submitPublisherVerificationAction } from "@/lib/actions/submit-publisher-verification";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function PublisherVerificationPage({
  params,
}: PageProps) {
  const { locale } = await params;

  const isRtl = locale === "ar";

  const { publisher } =
    await requirePublisher(locale);

  const isIndividual =
    publisher.publisher_type === "individual";

  if (isIndividual) {
    redirect(
      `/${locale}/publisher-dashboard/profile`,
    );
  }

  const verificationStatus =
    publisher.verification_status ??
    "unverified";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">
            {isRtl
              ? "توثيق الجهة"
              : "Organization Verification"}
          </p>

          <h1 className="mt-4 text-4xl font-light sm:text-5xl">
            {isRtl
              ? "أثبت ارتباطك بالجهة"
              : "Verify Your Organization"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            {isRtl
              ? "لحماية المواهب ورفع مستوى الثقة داخل ملامح، نحتاج إلى التحقق من أنك مخول بتمثيل هذه الجهة."
              : "To protect talent and maintain trust on MLAMH, we need to verify that you are authorized to represent this organization."}
          </p>
        </div>

        {verificationStatus === "verified" ? (
          <section className="rounded-[2rem] border border-emerald-400/25 bg-emerald-400/[0.06] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              {isRtl
                ? "الحالة"
                : "Status"}
            </p>

            <h2 className="mt-3 text-2xl font-light text-white">
              {isRtl
                ? "جهتك موثقة ✓"
                : "Your Organization Is Verified ✓"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/55">
              {isRtl
                ? "تم التحقق من ارتباط حسابك بهذه الجهة."
                : "Your connection to this organization has been verified."}
            </p>

            <Link
              href={`/${locale}/publisher-dashboard/profile`}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm text-white/70 transition hover:border-gold/40 hover:text-gold"
            >
              {isRtl
                ? "العودة إلى ملف الجهة"
                : "Back to Organization Profile"}
            </Link>
          </section>
        ) : verificationStatus === "pending" ? (
          <section className="rounded-[2rem] border border-amber-400/25 bg-amber-400/[0.06] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200">
              {isRtl
                ? "الحالة"
                : "Status"}
            </p>

            <h2 className="mt-3 text-2xl font-light text-white">
              {isRtl
                ? "طلبك قيد المراجعة"
                : "Your Request Is Under Review"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/55">
              {isRtl
                ? "استلمنا طلب التوثيق وسيقوم فريق ملامح بمراجعته."
                : "We received your verification request and the MLAMH team will review it."}
            </p>

            <Link
              href={`/${locale}/publisher-dashboard/profile`}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm text-white/70 transition hover:border-gold/40 hover:text-gold"
            >
              {isRtl
                ? "العودة إلى ملف الجهة"
                : "Back to Organization Profile"}
            </Link>
          </section>
        ) : (
          <>
            {verificationStatus === "rejected" ? (
  <section className="mb-8 rounded-[2rem] border border-red-400/20 bg-red-400/[0.06] p-6 md:p-8">
    <p className="text-xs uppercase tracking-[0.3em] text-red-300">
      {isRtl
        ? "حالة التوثيق"
        : "Verification Status"}
    </p>

    <h2 className="mt-3 text-2xl font-light text-white">
      {isRtl
        ? "تعذر اعتماد طلب التوثيق"
        : "Verification Request Rejected"}
    </h2>

    <p className="mt-3 text-sm leading-7 text-white/55">
      {isRtl
        ? "راجع سبب الرفض أدناه ثم حدّث بيانات التوثيق وأعد إرسال الطلب."
        : "Review the reason below, update your verification information, and submit a new request."}
    </p>

    {publisher.verification_rejection_reason ? (
      <div className="mt-6 rounded-2xl border border-red-400/15 bg-black/20 p-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-red-300/70">
          {isRtl
            ? "سبب الرفض"
            : "Rejection Reason"}
        </p>

        <p className="mt-3 text-sm leading-7 text-red-100">
          {publisher.verification_rejection_reason}
        </p>
      </div>
    ) : null}

    {publisher.verification_reviewed_at ? (
      <p className="mt-4 text-xs text-white/30">
        {isRtl
          ? `تمت مراجعة الطلب: ${new Intl.DateTimeFormat(
              "ar-SA",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            ).format(
              new Date(
                publisher.verification_reviewed_at,
              ),
            )}`
          : `Reviewed: ${new Intl.DateTimeFormat(
              "en",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            ).format(
              new Date(
                publisher.verification_reviewed_at,
              ),
            )}`}
      </p>
    ) : null}
  </section>
) : null}

            <section className="grid gap-5 md:grid-cols-3">
            <form
  action={submitPublisherVerificationAction}
  className="relative rounded-[2rem] border border-gold/25 bg-gold/[0.035] p-6"
>
  <input
    type="hidden"
    name="locale"
    value={locale}
  />

  <input
    type="hidden"
    name="verification_method"
    value="company_email"
  />

  <span className="absolute end-5 top-5 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">
    {isRtl ? "موصى به" : "Recommended"}
  </span>

  <h2 className="mt-8 text-xl font-light text-white">
    {isRtl
      ? "البريد الرسمي للجهة"
      : "Official Company Email"}
  </h2>

  <p className="mt-3 text-sm leading-7 text-white/45">
    {isRtl
      ? "استخدم بريدًا رسميًا على نطاق الجهة مثل name@company.com. لا نقبل Gmail أو Hotmail والبريد الشخصي العام."
      : "Use an official email address on the organization domain, such as name@company.com. Public personal email providers are not accepted."}
  </p>

  <label className="mt-6 block text-xs uppercase tracking-[0.2em] text-white/40">
    {isRtl
      ? "البريد الرسمي"
      : "Official Email"}
  </label>

  <input
    type="email"
    name="verification_email"
    defaultValue={
      publisher.verification_email ?? ""
    }
    required
    dir="ltr"
    autoComplete="email"
    placeholder="name@company.com"
    className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
  />

<button
  type="submit"
  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft"
>
  {verificationStatus === "rejected"
    ? isRtl
      ? "إعادة إرسال طلب التوثيق"
      : "Resubmit Verification Request"
    : isRtl
      ? "إرسال طلب التوثيق"
      : "Submit Verification Request"}
</button>
</form>

              <VerificationMethodCard
                isRtl={isRtl}
                titleAr="وثيقة رسمية"
                titleEn="Official Document"
                descriptionAr="سجل تجاري أو ترخيص أو وثيقة رسمية تثبت بيانات الجهة."
                descriptionEn="Commercial registration, license, or another official organization document."
              />

              <VerificationMethodCard
                isRtl={isRtl}
                titleAr="بطاقة عمل"
                titleEn="Business Card"
                descriptionAr="ارفع بطاقة عمل توضح اسمك واسم الجهة وبيانات التواصل."
                descriptionEn="Upload a business card showing your name, organization, and contact details."
              />
            </section>

            <div className="mt-10">
              <Link
                href={`/${locale}/publisher-dashboard/profile`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                {isRtl
                  ? "العودة إلى ملف الجهة"
                  : "Back to Organization Profile"}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function VerificationMethodCard({
  isRtl,
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
  recommended = false,
}: {
  isRtl: boolean;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  recommended?: boolean;
}) {
  return (
    <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
      {recommended ? (
        <span className="absolute end-5 top-5 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">
          {isRtl
            ? "موصى به"
            : "Recommended"}
        </span>
      ) : null}

      <h2 className="mt-8 text-xl font-light text-white">
        {isRtl
          ? titleAr
          : titleEn}
      </h2>

      <p className="mt-3 text-sm leading-7 text-white/45">
        {isRtl
          ? descriptionAr
          : descriptionEn}
      </p>

      <div className="mt-6 text-xs uppercase tracking-[0.2em] text-white/30">
        {isRtl
          ? "سنفعّل هذه الطريقة في الخطوة التالية"
          : "This method will be enabled in the next step"}
      </div>
    </div>
  );
}