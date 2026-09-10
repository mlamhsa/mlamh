import { TalentFeaturedEntryPoint } from "@/components/payments/TalentFeaturedEntryPoint";
import { TalentBirthDateEnhancer } from "@/components/talent-dashboard/TalentBirthDateEnhancer";
import { TalentProfileCanonicalFieldsV1 } from "@/components/talent-dashboard/TalentProfileCanonicalFieldsV1";
import { TalentProfileEditorEnhancer } from "@/components/talent-dashboard/TalentProfileEditorEnhancer";
import { TalentProfileSectionNavigationV1 } from "@/components/talent-dashboard/TalentProfileSectionNavigationV1";
import { TalentSidebarDockEnhancer } from "@/components/talent-dashboard/TalentSidebarDockEnhancer";
import TalentDashboardShell from "@/components/talent/TalentDashboardShell";
import TalentRealtimeSync from "@/components/talent/TalentRealtimeSync";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  if (user) {
    const { data: talent } = await supabase
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    talentId = talent?.id ?? null;
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
      <TalentDashboardShell locale={locale}>{children}</TalentDashboardShell>
    </>
  );
}
