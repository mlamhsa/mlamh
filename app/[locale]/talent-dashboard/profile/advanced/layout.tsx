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

  // For approved talents, “Edit details” should open the normal profile editor.
  // Professional data stays directly editable there, while protected identity
  // changes remain available as a separate reviewed request only when needed.
  if (approvalStatus === "approved") {
    redirect(`/${locale}/talent-dashboard/profile/details`);
  }

  return children;
}
