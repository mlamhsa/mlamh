"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { createAdminClient } from "@/lib/supabase/admin";

function parseClaimId(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid claim request id");
  }

  return id;
}

export async function approveTalentClaimAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();

  let id: number;

  try {
    id = parseClaimId(formData);
  } catch {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_claim",
      outcome: "blocked",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: "invalid-input",
      reason: "invalid_claim_request_id",
    });

    throw new Error(
      "Invalid claim request id",
    );
  }
  const supabase = createAdminClient();

  const { data: claim, error: claimError } = await supabase
    .from("talent_claim_requests")
    .select("id, talent_id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (claimError || !claim) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_claim",
      outcome: "failed",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "claim_request_not_found",
    });

    throw new Error("Claim request not found");
  }

  if (claim.status !== "pending") {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_claim",
      outcome: "noop",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "claim_request_already_processed",
      metadata: {
        current_status:
          claim.status,
        talent_id:
          claim.talent_id,
        claimant_user_id:
          claim.user_id,
      },
    });

    throw new Error(
      "Claim request has already been processed",
    );
  }

  const {
    data: talent,
    error: talentLookupError,
  } = await supabase
    .from("talents")
    .select("id,user_id")
    .eq("id", claim.talent_id)
    .maybeSingle();

  if (
    talentLookupError ||
    !talent
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_claim",
      outcome: "failed",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "talent_not_found",
      metadata: {
        talent_id:
          claim.talent_id,
      },
    });

    throw new Error(
      "Claimed talent was not found",
    );
  }

  const previousTalentUserId =
    talent.user_id ?? null;

  const { error: talentError } = await supabase
    .from("talents")
    .update({ user_id: claim.user_id })
    .eq("id", claim.talent_id);

  if (talentError) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_claim",
      outcome: "failed",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "talent_assignment_failed",
      metadata: {
        talent_id:
          claim.talent_id,
        claimant_user_id:
          claim.user_id,
      },
    });

    throw new Error(`[approveTalentClaimAction] ${talentError.message}`);
  }

  const { error: updateError } = await supabase
    .from("talent_claim_requests")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("status", "pending");

  if (updateError) {
    let rollbackSucceeded = true;

    const { error: rollbackError } =
      await supabase
        .from("talents")
        .update({
          user_id:
            previousTalentUserId,
        })
        .eq("id", claim.talent_id);

    if (rollbackError) {
      rollbackSucceeded = false;
      console.error(
        "[approveTalentClaimAction rollback]",
        rollbackError,
      );
    }

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "approve_talent_claim",
      outcome: "failed",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "claim_status_update_failed",
      metadata: {
        talent_id:
          claim.talent_id,
        claimant_user_id:
          claim.user_id,
        previous_talent_user_id:
          previousTalentUserId,
        rollback_succeeded:
          rollbackSucceeded,
      },
    });

    throw new Error(`[approveTalentClaimAction] ${updateError.message}`);
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "approve_talent_claim",
    outcome: "success",
    target: EVENT_TARGETS.CLAIM_REQUEST,
    targetId: id,
    metadata: {
      talent_id:
        claim.talent_id,
      claimant_user_id:
        claim.user_id,
      previous_talent_user_id:
        previousTalentUserId,
      new_talent_user_id:
        claim.user_id,
      previous_claim_status:
        claim.status,
      new_claim_status:
        "approved",
    },
  });

  revalidatePath("/admin/claim-requests");
  revalidatePath("/talent-dashboard");
}

export async function rejectTalentClaimAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();

  let id: number;

  try {
    id = parseClaimId(formData);
  } catch {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_claim",
      outcome: "blocked",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: "invalid-input",
      reason: "invalid_claim_request_id",
    });

    throw new Error(
      "Invalid claim request id",
    );
  }
  const supabase = createAdminClient();

  const {
    data: claim,
    error: claimError,
  } = await supabase
    .from("talent_claim_requests")
    .select("id,talent_id,user_id,status")
    .eq("id", id)
    .maybeSingle();

  if (claimError || !claim) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_claim",
      outcome: "failed",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "claim_request_not_found",
    });

    throw new Error(
      "Claim request not found",
    );
  }

  if (claim.status !== "pending") {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_claim",
      outcome: "noop",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "claim_request_already_processed",
      metadata: {
        current_status:
          claim.status,
        talent_id:
          claim.talent_id,
      },
    });

    throw new Error(
      "Claim request has already been processed",
    );
  }

  const { data, error } = await supabase
    .from("talent_claim_requests")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "reject_talent_claim",
      outcome: "failed",
      target: EVENT_TARGETS.CLAIM_REQUEST,
      targetId: id,
      reason: "claim_rejection_failed",
      metadata: {
        talent_id:
          claim.talent_id,
      },
    });

    throw new Error(
      `[rejectTalentClaimAction] ${error?.message ?? "Claim request was not updated"}`,
    );
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "reject_talent_claim",
    outcome: "success",
    target: EVENT_TARGETS.CLAIM_REQUEST,
    targetId: id,
    metadata: {
      talent_id:
        claim.talent_id,
      claimant_user_id:
        claim.user_id,
      previous_claim_status:
        claim.status,
      new_claim_status:
        "rejected",
    },
  });

  revalidatePath("/admin/claim-requests");
}