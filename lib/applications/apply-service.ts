import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import type { ApplyOpportunityResult } from "@/lib/applications/apply-contract";
import {
  isApplicationWindowClosed,
  isOpportunityAvailable,
  isValidOpportunityId,
} from "@/lib/applications/apply-rules";
import { trackEvent } from "@/lib/events/track-event";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

export type ApplyOpportunityServiceInput = {
  userId: string;
  opportunityId: number;
};

export async function applyToOpportunity(
  input: ApplyOpportunityServiceInput,
): Promise<ApplyOpportunityResult> {
  const { userId, opportunityId } = input;

  if (!isValidOpportunityId(opportunityId)) {
    return { ok: false, code: "INVALID_OPPORTUNITY" };
  }

  const adminClient = createAdminClient();

  await trackEvent({
    type: "application_started",
    target: "opportunity",
    targetId: opportunityId,
    actorId: userId,
    metadata: { logged_in: true },
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_type, status, approval_status, phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Apply opportunity profile lookup error:", profileError);
    return { ok: false, code: "PROFILE_LOOKUP_FAILED" };
  }

  if (!profile || profile.account_type !== "talent") {
    return { ok: false, code: "NOT_TALENT" };
  }

  if (isRestrictedAccountStatus(profile.status)) {
    return { ok: false, code: "ACCOUNT_RESTRICTED" };
  }

  if (profile.approval_status !== "approved") {
    return { ok: false, code: "TALENT_NOT_APPROVED" };
  }

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select(`
      id,
      name_ar,
      name_en,
      image_url,
      primary_role,
      city_slug,
      gender,
      nationality,
      nationality_slug,
      date_of_birth,
      bio_ar,
      bio_en,
      height_cm,
      acting_age_min,
      acting_age_max,
      modeling_types
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (talentError) {
    console.error("Apply opportunity talent lookup error:", talentError);
    return { ok: false, code: "TALENT_LOOKUP_FAILED" };
  }

  if (!talent) {
    return { ok: false, code: "NOT_TALENT" };
  }

  const profileReadiness = getTalentProfileReadiness({
    ...talent,
    phone: profile.phone,
  });

  if (!profileReadiness.isReady) {
    console.log("[Talent profile readiness]", {
      talentId: talent.id,
      primaryRole: talent.primary_role,
      missingRequirements: profileReadiness.missingRequirements,
    });

    return {
      ok: false,
      code: "PROFILE_INCOMPLETE",
      details: {
        missingRequirements: profileReadiness.missingRequirements,
      },
    };
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id, slug, status, published, created_at, application_days")
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError) {
    console.error("Apply opportunity lookup error:", opportunityError);
    return { ok: false, code: "OPPORTUNITY_LOOKUP_FAILED" };
  }

  if (!isOpportunityAvailable(opportunity)) {
    return { ok: false, code: "OPPORTUNITY_NOT_AVAILABLE" };
  }

  if (
    isApplicationWindowClosed({
      createdAt: opportunity.created_at,
      applicationDays: opportunity.application_days,
    })
  ) {
    return { ok: false, code: "APPLICATION_WINDOW_CLOSED" };
  }

  const { data: existingApplication, error: existingApplicationError } =
    await adminClient
      .from("opportunity_applications")
      .select("id")
      .eq("opportunity_id", opportunity.id)
      .eq("talent_id", talent.id)
      .maybeSingle();

  if (existingApplicationError) {
    console.error("Existing application lookup error:", existingApplicationError);
    return { ok: false, code: "APPLICATION_LOOKUP_FAILED" };
  }

  if (existingApplication) {
    return { ok: false, code: "ALREADY_APPLIED" };
  }

  const { data: insertedApplication, error: insertError } = await adminClient
    .from("opportunity_applications")
    .insert({
      opportunity_id: opportunity.id,
      talent_id: talent.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, code: "ALREADY_APPLIED" };
    }

    console.error("Apply opportunity insert error:", insertError);
    return { ok: false, code: "APPLICATION_INSERT_FAILED" };
  }

  await trackEvent({
    type: "application_submitted",
    target: "application",
    targetId: insertedApplication.id,
    actorId: userId,
    metadata: {
      opportunity_id: opportunity.id,
      talent_id: talent.id,
      logged_in: true,
    },
  });

  return {
    ok: true,
    code: "SUCCESS",
    applicationId: insertedApplication.id,
    details: {
      opportunityId: opportunity.id,
      opportunitySlug: opportunity.slug,
    },
  } as ApplyOpportunityResult & {
    details: { opportunityId: number; opportunitySlug: string | null };
  };
}
