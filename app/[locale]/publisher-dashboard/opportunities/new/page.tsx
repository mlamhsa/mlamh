import { redirect } from "next/navigation";

import CreateOpportunityForm from "@/components/publisher/CreateOpportunityForm";
import FastQuickRequestForm from "@/components/publisher/FastQuickRequestForm";
import { requirePublisher } from "@/lib/auth/require-publisher";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function CreateOpportunityPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const safeLocale = locale === "en" ? "en" : "ar";
  const isRtl = safeLocale === "ar";

  const { profile, publisher } = await requirePublisher(safeLocale);

  const approvalStatus = profile.approval_status ?? "not_submitted";
  const isApproved = approvalStatus === "approved";
  const isSuspended = publisher.status === "suspended";

  if (!isApproved || isSuspended) {
    redirect(`/${safeLocale}/publisher-dashboard`);
  }

  const subtype = String(publisher.publisher_type_other ?? "");
  const isFastTrackPublisher =
    publisher.publisher_type === "individual" && subtype.startsWith("fast:");
  const explicitlyRequestedProject = query.mode === "project";

  if (isFastTrackPublisher && !explicitlyRequestedProject) {
    return (
      <FastQuickRequestForm
        locale={safeLocale}
        isRtl={isRtl}
        fallbackCity={publisher.city}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className={`sticky top-24 z-40 mx-auto max-w-7xl px-4 pt-3 sm:px-6 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="rounded-2xl border border-gold/30 bg-black/90 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">
                {isRtl ? "ترجمة تلقائية" : "Automatic Translation"}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/65">
                {isRtl
                  ? "اكتب عنوان الفرصة ووصفها بالعربية فقط. ملامح تنشئ النسخة الإنجليزية تلقائيًا عند الإرسال."
                  : "Write the title and description in English only. MLAMH creates the Arabic version automatically when you submit."}
              </p>
            </div>
            <span className="w-fit shrink-0 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-[11px] text-gold">
              {isRtl ? "AR → EN" : "EN → AR"}
            </span>
          </div>
        </div>
      </div>

      <CreateOpportunityForm locale={safeLocale} isRtl={isRtl} />
    </div>
  );
}
