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

  if (!isApproved || isSuspended) {
    redirect(
      `/${safeLocale}/publisher-dashboard`,
    );
  }

  return (
    <CreateOpportunityForm
      locale={safeLocale}
      isRtl={isRtl}
    />
  );
}