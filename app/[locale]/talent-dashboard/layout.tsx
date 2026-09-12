import { redirect } from "next/navigation";

import { TalentFeaturedEntryPoint } from "@/components/payments/TalentFeaturedEntryPoint";
import { TalentBirthDateEnhancer } from "@/components/talent-dashboard/TalentBirthDateEnhancer";
import { TalentProfileCanonicalFieldsV1 } from "@/components/talent-dashboard/TalentProfileCanonicalFieldsV1";
import { TalentProfileEditorEnhancer } from "@/components/talent-dashboard/TalentProfileEditorEnhancer";
import { TalentProfileSectionNavigationV1 } from "@/components/talent-dashboard/TalentProfileSectionNavigationV1";
import { TalentSidebarDockEnhancer } from "@/components/talent-dashboard/TalentSidebarDockEnhancer";
import TalentApprovedCompletionBanner from "@/components/talent/TalentApprovedCompletionBanner";
import TalentConsentCompletionCard from "@/components/talent/TalentConsentCompletionCard";
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
  const safeLocale = locale === "en" ? "en" : "ar";
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let talentId: string | number | null = null;
  let approvalStatus: string | null = null;
  let profileStrength = 0;
  let totalApplications = 0;
  let notificationCount = 0;
  let unreadMessagesCount = 0;

  if (user) {
    const [talentResult, profileResult] = await Promise.all([
      supabase.from("talents").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("profiles")
        .select("approval_status, account_type")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    // Some legacy users selected Talent before a row was ever created in
    // `talents`. Keep them out of a dead-end dashboard/profile loop and route
    // them through the one-time recovery step that creates their draft.
    if (
      profileResult.data?.account_type === "talent" &&
      !talentResult.data &&
      !talentResult.error
    ) {
      redirect(`/${safeLocale}/join/talent?message=recovery`);
    }

    talentId = talentResult.data?.id ?? null;
    approvalStatus = profileResult.data?.approval_status ?? null;
    profileStrength = talentResult.data
      ? calculateProfileCompletion(talentResult.data as never)
      : 0;

    if (talentId !== null) {
      const id = String(talentId);
      const [applicationsResult, notificationsResult, conversationsResult] = await Promise.all([
        supabase
          .from("opportunity_applications")
          .select("id", { count: "exact", head: true })
          .eq("talent_id", id),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_type", "talent")
          .eq("recipient_id", id)
          .eq("is_read", false),
        supabase.from("conversations").select("id").eq("talent_id", id),
      ]);

      totalApplications = applicationsResult.count ?? 0;
      notificationCount = notificationsResult.count ?? 0;
      const conversationIds = (conversationsResult.data ?? []).map((item) => item.id);

      if (conversationIds.length > 0) {
        const unreadMessagesResult = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .neq("sender_user_id", user.id)
          .is("read_at", null);
        unreadMessagesCount = unreadMessagesResult.count ?? 0;
      }
    }
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
      {user ? <TalentConsentCompletionCard locale={locale} /> : null}
      <TalentDashboardShell
        locale={locale}
        totalApplications={totalApplications}
        notificationCount={notificationCount}
        unreadMessagesCount={unreadMessagesCount}
      >
        {children}
      </TalentDashboardShell>
    </>
  );
}
