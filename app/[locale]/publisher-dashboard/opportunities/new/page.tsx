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
    <CreateOpportunityForm
      locale={safeLocale}
      isRtl={isRtl}
    />
  );
}