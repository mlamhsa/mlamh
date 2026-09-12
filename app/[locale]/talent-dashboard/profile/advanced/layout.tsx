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

  return (
    <div className="talent-required-fields-shell">
      {children}
      <style>{`
        .talent-required-fields-shell > main {
          padding-top: 0 !important;
        }
        .talent-required-fields-shell > main > div {
          max-width: 72rem !important;
        }
        @media (min-width: 1024px) {
          .talent-required-fields-shell > main {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
