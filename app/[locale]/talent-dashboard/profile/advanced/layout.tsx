import { redirect } from "next/navigation";

import { requireTalent } from "@/lib/auth/require-talent";

export default async function TalentAdvancedProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "en" ? "en" : "ar";
  const { profile } = await requireTalent(locale);
  const approvalStatus = String(profile?.approval_status ?? "").trim().toLowerCase();

  // Approved talents must not hit a dead-end protection screen. Protected
  // identity edits go through the existing reviewed change-request workflow,
  // while professional/non-protected details remain editable elsewhere.
  if (approvalStatus === "approved") {
    redirect(`/${locale}/talent-dashboard/profile/change-request`);
  }

  return children;
}
