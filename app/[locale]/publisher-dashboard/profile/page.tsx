import Link from "next/link";
import PublisherProfileForm from "@/components/publisher/profile/PublisherProfileForm";
import { requirePublisher } from "@/lib/auth/require-publisher";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
    submitted?: string;
    error?: string;
    missing?: string;
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
  const submitted =
  resolvedSearchParams.submitted === "1";

  const incomplete =
  resolvedSearchParams.error === "incomplete";

const missingFields =
  resolvedSearchParams.missing
    ? decodeURIComponent(
        resolvedSearchParams.missing
      )
        .split(",")
        .filter(Boolean)
    : [];

    const { publisher, profile } =
    await requirePublisher(locale);

  const isIndividual =
  publisher.publisher_type === "individual";

  const approvalStatus =
  profile.approval_status ?? "not_submitted";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className={isRtl ? "text-right" : "text-left"}>
            <p className="text-xs uppercase tracking-[0.4em] text-gold">
  {isIndividual
    ? isRtl
      ? "ملف الناشر الفردي"
      : "Individual Publisher Profile"
    : isRtl
      ? "ملف الجهة"
      : "Organization Profile"}
</p>

<h1 className="mt-4 text-5xl font-light">
  {isIndividual
    ? isRtl
      ? "تعديل ملفك"
      : "Edit Your Profile"
    : isRtl
      ? "تعديل ملف الجهة"
      : "Edit Organization Profile"}
</h1>

<p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
  {isIndividual
    ? isRtl
      ? "حدّث بياناتك المهنية ومعلومات التواصل والروابط الاجتماعية."
      : "Update your professional information, contact details, and social links."
    : isRtl
      ? "حدّث بيانات الجهة ومعلومات التواصل والروابط الاجتماعية."
      : "Update your organization details, contact information, and social links."}
</p>
          </div>

          <Link
            href={`/${locale}/publisher-dashboard`}
            className="inline-flex border border-white/15 px-6 py-3 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/50 hover:text-gold"
          >
            {isRtl ? "العودة للوحة" : "Back to Dashboard"}
          </Link>
        </div>

        {incomplete ? (
  <div className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-200">
    <p className="font-medium">
      {isRtl
        ? "أكمل البيانات المطلوبة قبل إرسال الملف للمراجعة."
        : "Complete the required information before submitting your profile for review."}
    </p>

    {missingFields.length > 0 ? (
      <p className="mt-2 text-xs leading-6 opacity-80">
        {isRtl
          ? `البيانات الناقصة: ${missingFields.join("، ")}`
          : `Missing information: ${missingFields.join(", ")}`}
      </p>
    ) : null}
  </div>
) : null}

{submitted ? (
  <div className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-200">
    {isRtl
      ? "تم إرسال الملف إلى فريق ملامح للمراجعة."
      : "Your profile has been submitted to the MLAMH team for review."}
  </div>
) : saved ? (
  <div className="mb-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
    {isRtl
      ? "تم حفظ التغييرات بنجاح."
      : "Changes saved successfully."}
  </div>
) : null}
        <PublisherProfileForm
  locale={locale}
  isRtl={isRtl}
  approvalStatus={approvalStatus}
  publisher={{
    ...publisher,
    phone:
      publisher.phone?.trim() ||
      profile.phone?.trim() ||
      null,
  }}
/>
      </div>
    </main>
  );
}