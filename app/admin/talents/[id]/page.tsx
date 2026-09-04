import { notFound } from "next/navigation";

import { AdminTalentRecoveryPanel } from "@/components/admin/talents/AdminTalentRecoveryPanel";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import { TalentService } from "@/lib/services/talents/TalentService";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import OriginalAdminTalentPage from "./page-original";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

type RecoveryEvent = {
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

function isGoogleProviderAvatar(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "googleusercontent.com" || hostname.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}

export default async function AdminTalentPage(props: PageProps) {
  await requireAdminAccess();

  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const talentId = Number(id);
  if (!Number.isInteger(talentId) || talentId <= 0) notFound();

  const talent = await TalentService.getAdminTalentById(talentId);
  if (!talent) notFound();

  const language = searchParams.lang === "en" ? "en" : "ar";
  const readiness = getTalentProfileReadiness({
    ...talent,
    phone: talent.account_phone ?? talent.whatsapp ?? null,
  });
  const profileCompletion = TalentProfileService.calculateCompletion(talent);
  const providerAvatarDetected = isGoogleProviderAvatar(talent.image_url);

  const adminClient = createAdminClient();
  const { data: reminderData, error: reminderError } = await adminClient
    .from("events")
    .select("created_at,metadata")
    .eq("event_type", "talent_profile_recovery_reminder_sent")
    .eq("target_type", "talent")
    .eq("target_id", String(talent.id))
    .order("created_at", { ascending: false });

  if (reminderError) {
    console.error("[AdminTalentPage.recoveryEvents]", reminderError);
  }

  const reminders = (reminderData ?? []) as RecoveryEvent[];
  const lastReminder = reminders[0] ?? null;

  return (
    <>
      <div dir={language === "ar" ? "rtl" : "ltr"} className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AdminTalentRecoveryPanel
            talentId={talent.id}
            language={language}
            approvalStatus={String(talent.approval_status ?? "not_submitted")}
            profileCompletion={profileCompletion}
            isReady={readiness.isReady}
            missingRequirements={readiness.missingRequirements.map((item) => ({
              key: item.key,
              label: language === "ar" ? item.ar : item.en,
            }))}
            reminderCount={reminders.length}
            lastReminderAt={lastReminder?.created_at ?? null}
            lastReminderKind={String(lastReminder?.metadata?.recovery_kind ?? "") || null}
            providerAvatarDetected={providerAvatarDetected}
          />
        </div>
      </div>
      <OriginalAdminTalentPage {...props} />
    </>
  );
}
