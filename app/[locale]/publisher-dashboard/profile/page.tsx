import Link from "next/link";
import PublisherProfileForm from "@/components/publisher/profile/PublisherProfileForm";
import { requirePublisher } from "@/lib/auth/require-publisher";

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
        <PublisherProfileForm
  locale={locale}
  isRtl={isRtl}
  publisher={publisher}
/>
      </div>
    </main>
  );
}