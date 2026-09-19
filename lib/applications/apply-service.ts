import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import type {
  ApplyOpportunityResult,
  OpportunityResponseMode,
} from "@/lib/applications/apply-contract";
import {
  isApplicationWindowClosed,
  isOpportunityAvailable,
  isValidOpportunityId,
} from "@/lib/applications/apply-rules";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { trackEvent } from "@/lib/events/track-event";
import { ensureOpportunityConversation } from "@/lib/messages/ensure-opportunity-conversation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

export type ApplyOpportunityServiceInput = {
  userId: string;
  opportunityId: number;
  locale?: "ar" | "en";
};

function getPostingMode(value: unknown): OpportunityResponseMode {
  return value === "quick" ? "quick" : "casting";
}

export async function applyToOpportunity(
  input: ApplyOpportunityServiceInput,
): Promise<ApplyOpportunityResult> {
  const { userId, opportunityId } = input;
  const locale = input.locale === "en" ? "en" : "ar";

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
    .select(
      "id,title,slug,status,published,created_at,application_days,posting_mode,publisher_id",
    )
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError) {
    console.error("Apply opportunity lookup error:", opportunityError);
    return { ok: false, code: "OPPORTUNITY_LOOKUP_FAILED" };
  }

  if (!opportunity || !isOpportunityAvailable(opportunity)) {
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

  const postingMode = getPostingMode(opportunity.posting_mode);

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
    let conversationId: number | null = null;
    if (postingMode === "quick" && opportunity.publisher_id) {
      try {
        conversationId = await ensureOpportunityConversation(adminClient, {
          applicationId: existingApplication.id,
          opportunityId: opportunity.id,
          publisherId: opportunity.publisher_id,
          talentId: talent.id,
        });
      } catch (error) {
        console.error("Ensure quick interest conversation error:", error);
      }
    }

    return {
      ok: false,
      code: "ALREADY_APPLIED",
      details: {
        postingMode,
        applicationId: existingApplication.id,
        conversationId,
      },
    };
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
      return {
        ok: false,
        code: "ALREADY_APPLIED",
        details: { postingMode },
      };
    }

    console.error("Apply opportunity insert error:", insertError);
    return { ok: false, code: "APPLICATION_INSERT_FAILED" };
  }

  let conversationId: number | null = null;

  if (postingMode === "quick" && opportunity.publisher_id) {
    try {
      conversationId = await ensureOpportunityConversation(adminClient, {
        applicationId: insertedApplication.id,
        opportunityId: opportunity.id,
        publisherId: opportunity.publisher_id,
        talentId: talent.id,
      });
    } catch (error) {
      console.error("Create quick interest conversation error:", error);
      return {
        ok: false,
        code: "QUICK_CONVERSATION_FAILED",
        details: {
          postingMode,
          applicationId: insertedApplication.id,
        },
      };
    }

    await createEvent({
      type: EVENT_TYPES.quick_request_interest,
      target: EVENT_TARGETS.PUBLISHER,
      targetId: opportunity.publisher_id,
      actorId: userId,
      metadata: {
        locale,
        title: opportunity.title ?? "",
        opportunityId: opportunity.id,
        opportunitySlug: opportunity.slug,
        applicationId: insertedApplication.id,
        talentId: talent.id,
        talent_name:
          locale === "ar"
            ? talent.name_ar || talent.name_en || ""
            : talent.name_en || talent.name_ar || "",
        conversationId,
      },
    });
  }

  await trackEvent({
    type: "application_submitted",
    target: "application",
    targetId: insertedApplication.id,
    actorId: userId,
    metadata: {
      opportunity_id: opportunity.id,
      talent_id: talent.id,
      posting_mode: postingMode,
      conversation_id: conversationId,
      logged_in: true,
    },
  });

  return {
    ok: true,
    code: "SUCCESS",
    applicationId: insertedApplication.id,
    opportunityId: opportunity.id,
    opportunitySlug: opportunity.slug ?? null,
    postingMode,
    conversationId,
  };
}
