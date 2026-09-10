import { TalentFeaturedEntryPoint } from "@/components/payments/TalentFeaturedEntryPoint";
import { TalentBirthDateEnhancer } from "@/components/talent-dashboard/TalentBirthDateEnhancer";
import { TalentProfileCanonicalFieldsV1 } from "@/components/talent-dashboard/TalentProfileCanonicalFieldsV1";
import { TalentProfileEditorEnhancer } from "@/components/talent-dashboard/TalentProfileEditorEnhancer";
import { TalentProfileSectionNavigationV1 } from "@/components/talent-dashboard/TalentProfileSectionNavigationV1";
import { TalentSidebarDockEnhancer } from "@/components/talent-dashboard/TalentSidebarDockEnhancer";
import TalentApprovedCompletionBanner from "@/components/talent/TalentApprovedCompletionBanner";
import TalentDashboardShell from "@/components/talent/TalentDashboardShell";
import TalentRealtimeSync from "@/components/talent/TalentRealtimeSync";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";

export default async function TalentDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let talentId: string | number | null = null;
  let approvalStatus: string | null = null;
  let profileStrength = 0;

  if (user) {
    const [talentResult, profileResult] = await Promise.all([
      supabase.from("talents").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("profiles")
        .select("approval_status")
        .eq("user_id", user.id)
        .eq("account_type", "talent")
        .maybeSingle(),
    ]);

    talentId = talentResult.data?.id ?? null;
    approvalStatus = profileResult.data?.approval_status ?? null;
    profileStrength = talentResult.data
      ? calculateProfileCompletion(talentResult.data as never)
      : 0;
  }

  return (
    <>
      <TalentBirthDateEnhancer />
      <TalentSidebarDockEnhancer />
      <TalentProfileEditorEnhancer />
      <TalentProfileCanonicalFieldsV1 />
      <TalentProfileSectionNavigationV1 />
      {user ? <TalentRealtimeSync userId={user.id} talentId={talentId} /> : null}
      {user ? (
        <TalentFeaturedEntryPoint locale={locale} userId={user.id} />
      ) : null}
      {user ? (
        <TalentApprovedCompletionBanner
          locale={locale}
          approvalStatus={approvalStatus}
          profileStrength={profileStrength}
        />
      ) : null}
      <TalentDashboardShell locale={locale}>{children}</TalentDashboardShell>
    </>
  );
}
