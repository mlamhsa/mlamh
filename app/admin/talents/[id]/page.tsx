import { notFound } from "next/navigation";

import { AdminTalentRecoveryPanel } from "@/components/admin/talents/AdminTalentRecoveryPanel";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import { TalentService } from "@/lib/services/talents/TalentService";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import { getNextTalentProfileRecoveryReminder } from "@/lib/talent/profile-recovery-schedule";
import type { TalentProfileRecoveryKind } from "@/lib/talent/send-profile-recovery-reminder";
import OriginalAdminTalentPage from "./page-original";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

type RecoveryEvent = {
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

type ProfileRow = {
  id: string | number;
  approval_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const MIN_REVIEW_COMPLETION = 35;

function normalizeUrl(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isGoogleHostedAvatar(value: unknown) {
  const url = normalizeUrl(value);
  if (!url) return false;

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "googleusercontent.com" || hostname.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}

function authUserUsesGoogleProvider(user: {
  app_metadata?: Record<string, unknown>;
  identities?: Array<{ provider?: string | null }> | null;
}) {
  const appProvider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider.toLowerCase()
      : "";

  const appProviders = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
        .filter((provider): provider is string => typeof provider === "string")
        .map((provider) => provider.toLowerCase())
    : [];

  const identityProviders = (user.identities ?? [])
    .map((identity) => identity.provider?.toLowerCase() ?? "")
    .filter(Boolean);

  return (
    appProvider === "google" ||
    appProviders.includes("google") ||
    identityProviders.includes("google")
  );
}

function getRecoveryKind({
  approvalStatus,
  isReady,
  profileCompletion,
}: {
  approvalStatus: string;
  isReady: boolean;
  profileCompletion: number;
}): TalentProfileRecoveryKind | null {
  if (approvalStatus === "changes_requested") return "changes_requested";
  if (approvalStatus !== "not_submitted") return null;

  return isReady && profileCompletion >= MIN_REVIEW_COMPLETION
    ? "ready_not_submitted"
    : "incomplete_profile";
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

  const adminClient = createAdminClient();

  let providerAvatarDetected = isGoogleHostedAvatar(talent.image_url);

  if (talent.user_id && talent.image_url) {
    const { data: authLookup, error: authLookupError } =
      await adminClient.auth.admin.getUserById(talent.user_id);

    if (authLookupError) {
      console.error("[AdminTalentPage.authAvatarSource]", authLookupError);
    } else if (authLookup.user && authUserUsesGoogleProvider(authLookup.user)) {
      const currentImage = normalizeUrl(talent.image_url);
      const avatarUrl = normalizeUrl(authLookup.user.user_metadata?.avatar_url);
      const pictureUrl = normalizeUrl(authLookup.user.user_metadata?.picture);

      providerAvatarDetected =
        providerAvatarDetected ||
        (!!currentImage && (currentImage === avatarUrl || currentImage === pictureUrl));
    }
  }

  const [{ data: reminderData, error: reminderError }, { data: profileData, error: profileError }] =
    await Promise.all([
      adminClient
        .from("events")
        .select("created_at,metadata")
        .eq("event_type", "talent_profile_recovery_reminder_sent")
        .eq("target_type", "talent")
        .eq("target_id", String(talent.id))
        .order("created_at", { ascending: false }),
      talent.user_id
        ? adminClient
            .from("profiles")
            .select("id,approval_status,created_at,updated_at")
            .eq("user_id", talent.user_id)
            .eq("account_type", "talent")
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (reminderError) {
    console.error("[AdminTalentPage.recoveryEvents]", reminderError);
  }

  if (profileError) {
    console.error("[AdminTalentPage.profileRecoveryState]", profileError);
  }

  const reminders = (reminderData ?? []) as RecoveryEvent[];
  const lastReminder = reminders[0] ?? null;
  const profile = (profileData ?? null) as ProfileRow | null;
  const approvalStatus = String(
    profile?.approval_status ?? talent.approval_status ?? "not_submitted",
  );
  const recoveryKind = getRecoveryKind({
    approvalStatus,
    isReady: readiness.isReady,
    profileCompletion,
  });

  let automaticReminderState:
    | "scheduled"
    | "due"
    | "completed"
    | "not_applicable"
    | "unavailable" = recoveryKind ? "unavailable" : "not_applicable";
  let nextAutomaticReminderAt: string | null = null;

  if (recoveryKind) {
    const remindersForKind = reminders.filter(
      (event) => String(event.metadata?.recovery_kind ?? "") === recoveryKind,
    );
    const lastReminderForKind = remindersForKind[0]?.created_at ?? null;

    let changeRequestedAt: string | null = null;
    if (recoveryKind === "changes_requested" && profile?.id) {
      const { data: latestReview, error: latestReviewError } = await adminClient
        .from("profile_review_history")
        .select("created_at")
        .eq("profile_id", profile.id)
        .eq("account_type", "talent")
        .eq("decision", "changes_requested")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestReviewError) {
        console.error("[AdminTalentPage.latestChangeRequest]", latestReviewError);
      } else {
        changeRequestedAt = latestReview?.created_at ?? null;
      }
    }

    const anchorCreatedAt =
      recoveryKind === "changes_requested"
        ? changeRequestedAt ?? profile?.updated_at ?? profile?.created_at ?? talent.created_at
        : recoveryKind === "ready_not_submitted"
          ? profile?.updated_at ?? profile?.created_at ?? talent.created_at
          : talent.created_at ?? profile?.created_at;

    if (anchorCreatedAt) {
      const nextReminder = getNextTalentProfileRecoveryReminder({
        anchorCreatedAt,
        sentReminderCount: remindersForKind.length,
        lastReminderSentAt: lastReminderForKind,
      });

      if (nextReminder.due) {
        automaticReminderState = "due";
        nextAutomaticReminderAt = nextReminder.scheduledAt.toISOString();
      } else if (nextReminder.reason === "schedule_completed") {
        automaticReminderState = "completed";
      } else if (nextReminder.scheduledAt) {
        automaticReminderState = "scheduled";
        nextAutomaticReminderAt = nextReminder.scheduledAt.toISOString();
      }
    }
  }

  return (
    <>
      <div dir={language === "ar" ? "rtl" : "ltr"} className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AdminTalentRecoveryPanel
            talentId={talent.id}
            language={language}
            approvalStatus={approvalStatus}
            profileCompletion={profileCompletion}
            isReady={readiness.isReady}
            missingRequirements={readiness.missingRequirements.map((item) => ({
              key: item.key,
              label: language === "ar" ? item.ar : item.en,
            }))}
            reminderCount={reminders.length}
            lastReminderAt={lastReminder?.created_at ?? null}
            lastReminderKind={String(lastReminder?.metadata?.recovery_kind ?? "") || null}
            automaticReminderState={automaticReminderState}
            nextAutomaticReminderAt={nextAutomaticReminderAt}
            currentRecoveryKind={recoveryKind}
            providerAvatarDetected={providerAvatarDetected}
          />
        </div>
      </div>
      <OriginalAdminTalentPage {...props} />
    </>
  );
}
