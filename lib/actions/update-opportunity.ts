"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

const publisherStatuses = [
  "draft",
  "pending_review",
  "needs_changes",
  "closed",
  "archived",
] as const;

const publiclyVisibleStatuses = ["open", "published"] as const;

const allowedGenders = ["any", "male", "female"] as const;

const compensationTypes = [
  "fixed",
  "negotiable",
  "unpaid",
] as const;

type PublisherStatus = (typeof publisherStatuses)[number];
type PublicStatus = (typeof publiclyVisibleStatuses)[number];
type OpportunityStatus = PublisherStatus | PublicStatus;
type AllowedGender = (typeof allowedGenders)[number];
type CompensationType =
  (typeof compensationTypes)[number];

type UpdateOpportunityPayload = {
  id: number;
  locale: string;
  title: string;
  description: string;
  city_ar: string;
  city_en: string;
  required_gender?: string | null;
  opportunity_type: string;
  status: string;
  min_age?: number | null;
max_age?: number | null;
compensation_type?: string | null;
budget?: string | null;
application_days?: number | null;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

function isOpportunityStatus(
  value: string,
): value is OpportunityStatus {
  return (
    publisherStatuses.includes(value as PublisherStatus) ||
    publiclyVisibleStatuses.includes(value as PublicStatus)
  );
}

function isValidAge(value: number | null) {
  return (
    value === null ||
    (Number.isInteger(value) && value >= 0 && value <= 100)
  );
}

function normalizeBudget(value: unknown) {
  const cleaned = cleanText(value).replace(/,/g, "");

  if (!cleaned) {
    return null;
  }

  if (!/^\d+$/.test(cleaned)) {
    throw new Error("Budget must contain numbers only.");
  }

  return cleaned;
}

export async function updateOpportunityAction(
  payload: UpdateOpportunityPayload,
) {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const locale = payload.locale === "en" ? "en" : "ar";
  const opportunityId = Number(payload.id);

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    throw new Error("Opportunity ID is required.");
  }

  const title = cleanText(payload.title);
  const description = cleanText(payload.description);
  const cityAr = cleanText(payload.city_ar);
  const cityEn = cleanText(payload.city_en);
  const gender = cleanText(payload.required_gender);
  const opportunityType = cleanText(payload.opportunity_type);
  const requestedStatus = cleanText(payload.status) || "draft";
  const minAge = payload.min_age ?? null;
  const maxAge = payload.max_age ?? null;
  const applicationDays =
  payload.application_days ?? 30;

if (
  !Number.isInteger(applicationDays) ||
  applicationDays < 1 ||
  applicationDays > 90
) {
  throw new Error(
    "Application period must be between 1 and 90 days.",
  );
}
  const compensationType =
  cleanText(payload.compensation_type) || "fixed";

if (
  !compensationTypes.includes(
    compensationType as CompensationType,
  )
) {
  throw new Error("Invalid compensation type.");
}

const normalizedBudget =
  compensationType === "fixed"
    ? normalizeBudget(payload.budget)
    : null;

if (
  compensationType === "fixed" &&
  !normalizedBudget
) {
  throw new Error(
    "A budget is required for fixed compensation.",
  );
}

  if (title.length < 3 || title.length > 120) {
    throw new Error(
      "Title must contain between 3 and 120 characters.",
    );
  }

  if (
    description.length < 20 ||
    description.length > 3000
  ) {
    throw new Error(
      "Description must contain between 20 and 3000 characters.",
    );
  }

  if (!cityAr || !cityEn) {
    throw new Error("City is required.");
  }

  if (!opportunityType) {
    throw new Error("Opportunity type is required.");
  }

  if (opportunityType.length > 80) {
    throw new Error("Opportunity type is too long.");
  }

  if (
    gender &&
    !allowedGenders.includes(gender as AllowedGender)
  ) {
    throw new Error("Invalid required gender.");
  }

  if (!isOpportunityStatus(requestedStatus)) {
    throw new Error("Invalid opportunity status.");
  }

  if (!isValidAge(minAge) || !isValidAge(maxAge)) {
    throw new Error(
      "Age must be a whole number between 0 and 100.",
    );
  }

  if (
    minAge !== null &&
    maxAge !== null &&
    minAge > maxAge
  ) {
    throw new Error(
      "Minimum age cannot be greater than maximum age.",
    );
  }

  const { data: profile, error: profileError } =
  await adminClient
    .from("profiles")
    .select("id, account_type, approval_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Update opportunity profile lookup error:",
      profileError,
    );

    throw new Error("Unable to verify your profile.");
  }

  if (!profile || profile.account_type !== "publisher") {
    throw new Error("Publisher access required.");
  }

  if (profile.approval_status !== "approved") {
    throw new Error(
      locale === "ar"
        ? "يجب اعتماد حساب الناشر من الإدارة قبل تعديل الفرص."
        : "Your publisher account must be approved before editing opportunities.",
    );
  }

  const { data: publisher, error: publisherError } =
  await adminClient
    .from("publishers")
    .select("id, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError) {
    console.error(
      "Update opportunity publisher lookup error:",
      publisherError,
    );

    throw new Error(
      "Unable to verify your publisher account.",
    );
  }

  if (!publisher) {
    throw new Error("Publisher account not found.");
  }

  if (publisher.status === "suspended") {
    throw new Error(
      locale === "ar"
        ? "حساب الناشر موقوف حاليًا ولا يمكنه تعديل الفرص."
        : "Your publisher account is currently suspended and cannot edit opportunities.",
    );
  }
  
  const { data: opportunity, error: opportunityError } =
    await adminClient
      .from("opportunities")
      .select("id, publisher_id, status")
      .eq("id", opportunityId)
      .eq("publisher_id", publisher.id)
      .maybeSingle();

  if (opportunityError) {
    console.error(
      "Update opportunity lookup error:",
      opportunityError,
    );

    throw new Error("Unable to load the opportunity.");
  }

  if (!opportunity) {
    throw new Error(
      "Opportunity not found or access denied.",
    );
  }

  const currentStatus = cleanText(opportunity.status);

  if (!isOpportunityStatus(currentStatus)) {
    throw new Error(
      "The current opportunity status is invalid.",
    );
  }

  const allowedNextStatuses: OpportunityStatus[] =
  currentStatus === "open" ||
  currentStatus === "published"
    ? [currentStatus, "closed", "archived"]
    : currentStatus === "needs_changes"
      ? ["draft", "pending_review", "closed", "archived"]
      : [
          "draft",
          "pending_review",
          "closed",
          "archived",
        ];

  if (!allowedNextStatuses.includes(requestedStatus)) {
    throw new Error(
      "Invalid opportunity status transition.",
    );
  }

  /*
   * عند تعديل فرصة منشورة مع إبقائها في حالتها الحالية،
   * تعاد إلى مراجعة الإدارة حتى لا تتغير بعد الاعتماد مباشرة.
   */
  const requiresNewReview =
    (currentStatus === "open" ||
      currentStatus === "published") &&
    requestedStatus === currentStatus;

    const isResubmittedAfterChanges =
  currentStatus === "needs_changes" &&
  requestedStatus === "pending_review";

  const finalStatus: OpportunityStatus =
    requiresNewReview
      ? "pending_review"
      : requestedStatus;

  const citySlug = createSlug(cityEn || cityAr);

  const isPubliclyVisible =
    finalStatus === "published" || finalStatus === "open";

  const {
    data: updatedOpportunity,
    error: updateError,
  } = await adminClient
    .from("opportunities")
    .update({
      title,
      description,
      city_slug: citySlug,
      city_ar: cityAr,
      city_en: cityEn,
      required_gender: gender || "any",
      opportunity_type: opportunityType,
      min_age: minAge,
max_age: maxAge,

compensation_type:
  compensationType as CompensationType,

budget: normalizedBudget,

application_days: applicationDays,

status: finalStatus,
      published: isPubliclyVisible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunity.id)
    .eq("publisher_id", publisher.id)
    .select("id")
    .single();

  if (updateError) {
    console.error(
      "Update opportunity error:",
      updateError,
    );

    throw new Error("Unable to update the opportunity.");
  }

  if (requiresNewReview || isResubmittedAfterChanges) {
    try {
      await createEvent({
        type: EVENT_TYPES.opportunity_pending_review,
        target: EVENT_TARGETS.ADMIN,
        targetId: "admin",
        actorId: publisher.id,
        metadata: {
          opportunityId: opportunity.id,
          publisherId: publisher.id,
          title,
          city_ar: cityAr,
          city_en: cityEn,
          opportunityType,
          compensationType,
          budget: normalizedBudget,
          reason: isResubmittedAfterChanges
  ? "resubmitted_after_changes"
  : "updated_after_publication",
        },
      });
    } catch (eventError) {
      console.error(
        "Failed to create opportunity review event:",
        eventError,
      );
    }
  }

  revalidatePath(`/${locale}/publisher-dashboard`);

  revalidatePath(
    `/${locale}/publisher-dashboard/opportunities`,
  );

  revalidatePath(
    `/${locale}/publisher-dashboard/opportunities/${opportunity.id}`,
  );

  revalidatePath(
    `/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`,
  );

  revalidatePath(`/${locale}/opportunities`);
  revalidatePath("/admin/opportunities");

  return {
    success: true,
    opportunity: updatedOpportunity,
    status: finalStatus,
    requiresReview:
requiresNewReview || isResubmittedAfterChanges,
  };
}