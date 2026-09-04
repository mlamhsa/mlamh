import { NextRequest, NextResponse } from "next/server";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import {
  getNextTalentProfileRecoveryReminder,
} from "@/lib/talent/profile-recovery-schedule";
import {
  sendTalentProfileRecoveryReminder,
  type TalentProfileRecoveryKind,
} from "@/lib/talent/send-profile-recovery-reminder";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_REVIEW_COMPLETION = 35;

const TALENT_SELECT = [
  "id",
  "user_id",
  "created_at",
  "updated_at",
  "name_ar",
  "name_en",
  "image_url",
  "primary_role",
  "city_slug",
  "city_ar",
  "city_en",
  "gender",
  "nationality",
  "nationality_slug",
  "date_of_birth",
  "bio_ar",
  "bio_en",
  "languages",
  "dialects",
  "skills",
  "availability_status",
  "portfolio_url",
  "showreel_url",
  "gallery_images",
  "acting_age_min",
  "acting_age_max",
  "modeling_types",
  "height_cm",
  "shoe_size",
  "hair_color",
  "eye_color",
  "chest_size",
  "waist_size",
  "hip_size",
  "previous_work",
].join(", ");

type ProfileRow = {
  id: string | number;
  user_id: string;
  approval_status: string | null;
  created_at: string | null;
};

type TalentRow = {
  id: string | number;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  primary_role: string | null;
  city_slug: string | null;
  city_ar: string | null;
  city_en: string | null;
  gender: string | null;
  nationality: string | null;
  nationality_slug: string | null;
  date_of_birth: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  languages: string[] | null;
  dialects: string[] | null;
  skills: string[] | null;
  availability_status: string | null;
  portfolio_url: string | null;
  showreel_url: string | null;
  gallery_images: string[] | null;
  acting_age_min: number | string | null;
  acting_age_max: number | string | null;
  modeling_types: string[] | null;
  height_cm: number | string | null;
  shoe_size: number | string | null;
  hair_color: string | null;
  eye_color: string | null;
  chest_size: number | string | null;
  waist_size: number | string | null;
  hip_size: number | string | null;
  previous_work: string | null;
};

type ReviewDecisionRow = {
  profile_id: string | number;
  reason: string | null;
  created_at: string | null;
};

type ReminderEventRow = {
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

type RecoveryClassification = {
  kind: TalentProfileRecoveryKind;
  missingItems: string[];
  profileCompletion: number;
};

function normalizeApprovalStatus(value: unknown) {
  const status = String(value ?? "").trim();
  return status || "not_submitted";
}

function classifyTalentRecovery(
  talent: TalentRow,
  approvalStatus: string,
): RecoveryClassification | null {
  if (approvalStatus === "changes_requested") {
    return {
      kind: "changes_requested",
      missingItems: [],
      profileCompletion: calculateProfileCompletion(talent),
    };
  }

  if (approvalStatus !== "not_submitted") {
    return null;
  }

  const readiness = getTalentProfileReadiness(talent);
  const profileCompletion = calculateProfileCompletion(talent);
  const isProfileReady =
    readiness.isReady && profileCompletion >= MIN_REVIEW_COMPLETION;

  if (isProfileReady) {
    return {
      kind: "ready_not_submitted",
      missingItems: [],
      profileCompletion,
    };
  }

  return {
    kind: "incomplete_profile",
    missingItems: readiness.missingRequirements.map(
      (requirement) => requirement.ar,
    ),
    profileCompletion,
  };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(
      "[TalentProfileRecoveryCron] CRON_SECRET is not configured",
    );
    return NextResponse.json(
      { success: false, error: "Cron configuration is incomplete." },
      { status: 500 },
    );
  }

  if (
    request.headers.get("authorization") !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const adminClient = createAdminClient();

  const { data: profileData, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, user_id, approval_status, created_at")
      .eq("account_type", "talent")
      .or(
        "approval_status.is.null,approval_status.eq.not_submitted,approval_status.eq.changes_requested",
      );

  if (profileError) {
    console.error("[TalentProfileRecoveryCron.profiles]", profileError);
    return NextResponse.json(
      { success: false, error: "Unable to load talent profiles." },
      { status: 500 },
    );
  }

  const profiles = (profileData ?? []) as ProfileRow[];

  if (profiles.length === 0) {
    return NextResponse.json({
      success: true,
      checked: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    });
  }

  const userIds = profiles
    .map((profile) => String(profile.user_id ?? "").trim())
    .filter(Boolean);

  const { data: talentData, error: talentError } =
    await adminClient
      .from("talents")
      .select(TALENT_SELECT)
      .in("user_id", userIds);

  if (talentError) {
    console.error("[TalentProfileRecoveryCron.talents]", talentError);
    return NextResponse.json(
      { success: false, error: "Unable to load talent data." },
      { status: 500 },
    );
  }

  const talents = (talentData ?? []) as TalentRow[];
  const talentByUserId = new Map(
    talents
      .filter((talent) => Boolean(talent.user_id))
      .map((talent) => [String(talent.user_id), talent]),
  );

  const profileIds = profiles.map((profile) => profile.id);

  const { data: reviewData, error: reviewError } =
    await adminClient
      .from("profile_review_history")
      .select("profile_id, reason, created_at")
      .eq("account_type", "talent")
      .eq("decision", "changes_requested")
      .in("profile_id", profileIds)
      .order("created_at", { ascending: false });

  if (reviewError) {
    console.error("[TalentProfileRecoveryCron.reviewHistory]", reviewError);
    return NextResponse.json(
      { success: false, error: "Unable to load review history." },
      { status: 500 },
    );
  }

  const latestReviewByProfileId = new Map<string, ReviewDecisionRow>();

  for (const row of (reviewData ?? []) as ReviewDecisionRow[]) {
    const key = String(row.profile_id);
    if (!latestReviewByProfileId.has(key)) {
      latestReviewByProfileId.set(key, row);
    }
  }

  const talentIds = talents.map((talent) => String(talent.id));

  const { data: eventData, error: eventError } =
    talentIds.length > 0
      ? await adminClient
          .from("events")
          .select("target_id, metadata, created_at")
          .eq(
            "event_type",
            EVENT_TYPES.talent_profile_recovery_reminder_sent,
          )
          .eq("target_type", EVENT_TARGETS.TALENT)
          .in("target_id", talentIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (eventError) {
    console.error("[TalentProfileRecoveryCron.events]", eventError);
    return NextResponse.json(
      { success: false, error: "Unable to load reminder history." },
      { status: 500 },
    );
  }

  const reminderCounts = new Map<string, number>();
  const lastReminderByKey = new Map<string, string>();

  for (const event of (eventData ?? []) as ReminderEventRow[]) {
    const targetId = String(event.target_id ?? "").trim();
    const recoveryKind = String(
      event.metadata?.recovery_kind ?? "",
    ).trim();

    if (!targetId || !recoveryKind) {
      continue;
    }

    const key = `${targetId}:${recoveryKind}`;
    reminderCounts.set(key, (reminderCounts.get(key) ?? 0) + 1);

    if (event.created_at && !lastReminderByKey.has(key)) {
      lastReminderByKey.set(key, event.created_at);
    }
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const profile of profiles) {
    const talent = talentByUserId.get(profile.user_id);

    if (!talent) {
      skipped += 1;
      continue;
    }

    const approvalStatus = normalizeApprovalStatus(profile.approval_status);
    const classification = classifyTalentRecovery(talent, approvalStatus);

    if (!classification) {
      skipped += 1;
      continue;
    }

    const { kind } = classification;
    const review = latestReviewByProfileId.get(String(profile.id));
    const changeReason =
      kind === "changes_requested" ? review?.reason ?? null : null;

    const anchorCreatedAt =
      kind === "changes_requested"
        ? review?.created_at ?? profile.created_at ?? talent.created_at
        : kind === "ready_not_submitted"
          ? talent.updated_at ?? talent.created_at ?? profile.created_at
          : talent.created_at ?? profile.created_at;

    if (!anchorCreatedAt) {
      skipped += 1;
      continue;
    }

    const countKey = `${String(talent.id)}:${kind}`;
    const sentReminderCount = reminderCounts.get(countKey) ?? 0;
    const lastReminderSentAt = lastReminderByKey.get(countKey) ?? null;
    const nextReminder = getNextTalentProfileRecoveryReminder({
      anchorCreatedAt,
      sentReminderCount,
      lastReminderSentAt,
    });

    if (!nextReminder.due) {
      skipped += 1;
      continue;
    }

    /*
     * Re-read both workflow status and talent data immediately before the
     * email. This closes the race where the user completes a missing item or
     * submits the profile while the cron is processing an older snapshot.
     */
    const [currentProfileResult, currentTalentResult] = await Promise.all([
      adminClient
        .from("profiles")
        .select("approval_status")
        .eq("id", profile.id)
        .maybeSingle(),
      adminClient
        .from("talents")
        .select(TALENT_SELECT)
        .eq("id", talent.id)
        .maybeSingle(),
    ]);

    if (currentProfileResult.error || currentTalentResult.error) {
      failed += 1;
      console.error("[TalentProfileRecoveryCron.currentState]", {
        profileError: currentProfileResult.error,
        talentError: currentTalentResult.error,
      });
      continue;
    }

    if (!currentProfileResult.data || !currentTalentResult.data) {
      skipped += 1;
      continue;
    }

    const currentTalent = currentTalentResult.data as TalentRow;
    const currentApprovalStatus = normalizeApprovalStatus(
      currentProfileResult.data.approval_status,
    );
    const currentClassification = classifyTalentRecovery(
      currentTalent,
      currentApprovalStatus,
    );

    if (!currentClassification || currentClassification.kind !== kind) {
      skipped += 1;
      continue;
    }

    const currentMissingItems = currentClassification.missingItems;

    const result = await sendTalentProfileRecoveryReminder({
      userId: profile.user_id,
      locale: "ar",
      kind,
      missingItems: currentMissingItems,
      changeReason,
    });

    if (!result.success) {
      failed += 1;
      console.error("[TalentProfileRecoveryCron.send]", {
        userId: profile.user_id,
        talentId: talent.id,
        kind,
        status: result.status,
        message: result.message,
      });
      continue;
    }

    try {
      await createEvent({
        type: EVENT_TYPES.talent_profile_recovery_reminder_sent,
        target: EVENT_TARGETS.TALENT,
        targetId: String(talent.id),
        actorId: null,
        metadata: {
          locale: "ar",
          email: result.email,
          provider: result.provider,
          reminder_channel: "email",
          reminder_source: "system",
          recovery_kind: kind,
          reminder_number: nextReminder.reminderNumber,
          scheduled_at: nextReminder.scheduledAt.toISOString(),
          profile_completion: currentClassification.profileCompletion,
          missing_requirements: currentMissingItems,
          change_reason: changeReason,
        },
      });
      sent += 1;
    } catch (createEventError) {
      failed += 1;
      console.error("[TalentProfileRecoveryCron.event]", {
        talentId: talent.id,
        kind,
        createEventError,
      });
    }
  }

  return NextResponse.json({
    success: true,
    checked: profiles.length,
    sent,
    skipped,
    failed,
  });
}
