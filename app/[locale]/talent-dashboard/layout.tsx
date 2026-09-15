import { redirect } from "next/navigation";

import { TalentFeaturedEntryPoint } from "@/components/payments/TalentFeaturedEntryPoint";
import TalentApprovedLegacyRequiredFieldsCard from "@/components/talent/TalentApprovedLegacyRequiredFieldsCard";
import TalentConsentCompletionCard from "@/components/talent/TalentConsentCompletionCard";
import TalentDashboardHomeOnly from "@/components/talent/TalentDashboardHomeOnly";
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
  const safeLocale = locale === "en" ? "en" : "ar";
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let talentId: string | number | null = null;
  let totalApplications = 0;
  let notificationCount = 0;
  let unreadMessagesCount = 0;

  if (user) {
    const [talentResult, profileResult] = await Promise.all([
      supabase.from("talents").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (
      profileResult.data?.account_type === "talent" &&
      !talentResult.data &&
      !talentResult.error
    ) {
      redirect(`/${safeLocale}/join/talent?message=recovery`);
    }

    talentId = talentResult.data?.id ?? null;

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
      {user ? <TalentRealtimeSync userId={user.id} talentId={talentId} /> : null}
      {user ? (
        <TalentDashboardHomeOnly locale={safeLocale}>
          <TalentFeaturedEntryPoint locale={locale} userId={user.id} />
        </TalentDashboardHomeOnly>
      ) : null}
      {user ? <TalentConsentCompletionCard locale={locale} /> : null}
      {user ? <TalentApprovedLegacyRequiredFieldsCard locale={locale} /> : null}
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
