import { TalentFeaturedEntryPoint } from "@/components/payments/TalentFeaturedEntryPoint";
import { TalentProfileCanonicalFieldsV1 } from "@/components/talent-dashboard/TalentProfileCanonicalFieldsV1";
import { TalentProfileEditorEnhancer } from "@/components/talent-dashboard/TalentProfileEditorEnhancer";
import { TalentProfileSectionNavigationV1 } from "@/components/talent-dashboard/TalentProfileSectionNavigationV1";
import TalentDashboardShell from "@/components/talent/TalentDashboardShell";
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

  return (
    <>
      <TalentProfileEditorEnhancer />
      <TalentProfileCanonicalFieldsV1 />
      <TalentProfileSectionNavigationV1 />
      {user ? (
        <TalentFeaturedEntryPoint locale={locale} userId={user.id} />
      ) : null}
      <TalentDashboardShell locale={locale}>{children}</TalentDashboardShell>
    </>
  );
}
