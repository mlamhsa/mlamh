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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  primary_role: string | null;
  city_slug: string | null;
  gender: string | null;
  nationality: string | null;
  nationality_slug: string | null;
  date_of_birth: string | null;
};

type ReviewDecisionRow = {
  profile_id: string | number;
  reason: string | null;
  created_at: string | null;
};

type ReminderEventRow = {
  target_id: string | null;
  metadata: Record<string, unknown> | null;
};

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
      .in("approval_status", ["not_submitted", "changes_requested"]);

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
      .select(
        "id, user_id, created_at, name_ar, name_en, image_url, primary_role, city_slug, gender, nationality, nationality_slug, date_of_birth",
      )
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
          .select("target_id, metadata")
          .eq(
            "event_type",
            EVENT_TYPES.talent_profile_recovery_reminder_sent,
          )
          .eq("target_type", EVENT_TARGETS.TALENT)
          .in("target_id", talentIds)
      : { data: [], error: null };

  if (eventError) {
    console.error("[TalentProfileRecoveryCron.events]", eventError);
    return NextResponse.json(
      { success: false, error: "Unable to load reminder history." },
      { status: 500 },
    );
  }

  const reminderCounts = new Map<string, number>();

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

    const readiness = getTalentProfileReadiness(talent);
    const approvalStatus = profile.approval_status ?? "not_submitted";

    let kind: TalentProfileRecoveryKind;
    let anchorCreatedAt: string | null;
    let missingItems: string[] = [];
    let changeReason: string | null = null;

    if (approvalStatus === "changes_requested") {
      kind = "changes_requested";
      const review = latestReviewByProfileId.get(String(profile.id));
      anchorCreatedAt = review?.created_at ?? profile.created_at ?? talent.created_at;
      changeReason = review?.reason ?? null;
    } else if (readiness.isReady) {
      kind = "ready_not_submitted";
      anchorCreatedAt = talent.created_at ?? profile.created_at;
    } else {
      kind = "incomplete_profile";
      anchorCreatedAt = talent.created_at ?? profile.created_at;
      missingItems = readiness.missingRequirements.map(
        (requirement) => requirement.ar,
      );
    }

    if (!anchorCreatedAt) {
      skipped += 1;
      continue;
    }

    const countKey = `${String(talent.id)}:${kind}`;
    const sentReminderCount = reminderCounts.get(countKey) ?? 0;
    const nextReminder = getNextTalentProfileRecoveryReminder({
      anchorCreatedAt,
      sentReminderCount,
    });

    if (!nextReminder.due) {
      skipped += 1;
      continue;
    }

    /*
     * Re-check the current workflow state immediately before sending.
     * If the talent submitted, was approved/rejected, or changed state
     * while this cron was running, no email is sent.
     */
    const { data: currentProfile, error: currentProfileError } =
      await adminClient
        .from("profiles")
        .select("approval_status")
        .eq("id", profile.id)
        .maybeSingle();

    if (currentProfileError) {
      failed += 1;
      console.error(
        "[TalentProfileRecoveryCron.currentProfile]",
        currentProfileError,
      );
      continue;
    }

    if (
      !currentProfile ||
      !["not_submitted", "changes_requested"].includes(
        String(currentProfile.approval_status ?? "not_submitted"),
      )
    ) {
      skipped += 1;
      continue;
    }

    const result = await sendTalentProfileRecoveryReminder({
      userId: profile.user_id,
      locale: "ar",
      kind,
      missingItems,
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
          missing_requirements: missingItems,
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
