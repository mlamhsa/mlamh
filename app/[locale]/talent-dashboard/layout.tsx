import { TalentFeaturedEntryPoint } from "@/components/payments/TalentFeaturedEntryPoint";
import { TalentProfileEditorEnhancer } from "@/components/talent-dashboard/TalentProfileEditorEnhancer";
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
      {user ? (
        <TalentFeaturedEntryPoint locale={locale} userId={user.id} />
      ) : null}
      {children}
    </>
  );
}
