import { redirect } from "next/navigation";

import CreateOpportunityForm from "@/components/publisher/CreateOpportunityForm";
import { requirePublisher } from "@/lib/auth/require-publisher";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function CreateOpportunityPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "ar";
  const isRtl = safeLocale === "ar";

  const { profile, publisher } =
    await requirePublisher(safeLocale);

  const approvalStatus =
    profile.approval_status ?? "not_submitted";

  const isApproved =
    approvalStatus === "approved";

  const isSuspended =
    publisher.status === "suspended";

  const isOrganization =
    publisher.publisher_type !== "individual";

  const isVerifiedOrganization =
    !isOrganization ||
    (
      publisher.verified === true &&
      publisher.verification_status === "verified"
    );

  if (!isApproved || isSuspended) {
    redirect(
      `/${safeLocale}/publisher-dashboard`,
    );
  }

  if (
    isOrganization &&
    !isVerifiedOrganization
  ) {
    redirect(
      `/${safeLocale}/publisher-dashboard/verification`,
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className={`mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">
                {isRtl ? "ترجمة تلقائية" : "Automatic Translation"}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/60">
                {isRtl
                  ? "اكتب عنوان الفرصة ووصفها بلغتك فقط. ستنشئ ملامح النسخة الإنجليزية تلقائيًا عند الإرسال."
                  : "Write the opportunity title and description in your language only. MLAMH will automatically create the Arabic version when you submit."}
              </p>
            </div>
            <span className="w-fit rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-[11px] text-gold">
              {isRtl ? "AR → EN" : "EN → AR"}
            </span>
          </div>
        </div>
      </div>

      <CreateOpportunityForm
        locale={safeLocale}
        isRtl={isRtl}
      />
    </div>
  );
}