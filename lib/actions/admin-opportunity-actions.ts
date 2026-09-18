"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";
import { recordAdminAction } from "@/lib/events/admin-audit";

import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";
import { createAdminClient } from "@/lib/supabase/admin";

type OpportunityStatus =
  | "published"
  | "rejected"
  | "draft"
  | "pending_review"
  | "needs_changes"
  | "closed"
  | "archived";

type AdminLocale = "ar" | "en";

function revalidateOpportunityPaths(id: number) {
  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
  revalidatePath("/ar/publisher-dashboard");
  revalidatePath("/en/publisher-dashboard");
  revalidatePath("/ar/publisher-dashboard/opportunities");
  revalidatePath("/en/publisher-dashboard/opportunities");
  revalidatePath(`/ar/publisher-dashboard/opportunities/${id}`);
  revalidatePath(`/en/publisher-dashboard/opportunities/${id}`);
}

function getEventTypeForStatus(status: OpportunityStatus) {
  switch (status) {
    case "published":
      return EVENT_TYPES.opportunity_published;
    case "rejected":
      return EVENT_TYPES.opportunity_rejected;
    case "needs_changes":
      return EVENT_TYPES.opportunity_needs_changes;
    default:
      return null;
  }
}

function getOpportunityId(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid opportunity ID.");
  }
  return id;
}

function getOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  return value.trim() || null;
}

function getLocale(formData: FormData): AdminLocale {
  return formData.get("locale") === "en" ? "en" : "ar";
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateApplicationDates(applicationDays: number) {
  const startDate = new Date();
  const deadlineDate = new Date(startDate);
  deadlineDate.setUTCDate(deadlineDate.getUTCDate() + applicationDays);
  return {
    applicationStartDate: formatDateOnly(startDate),
    applicationDeadline: formatDateOnly(deadlineDate),
  };
}

async function updateOpportunityStatus({
  id,
  status,
  published,
  locale = "ar",
  reason = null,
  adminNote = null,
}: {
  id: number;
  status: OpportunityStatus;
  published: boolean;
  locale?: AdminLocale;
  reason?: string | null;
  adminNote?: string | null;
}) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid opportunity ID.");

  const cleanReason = reason?.trim() || null;
  const cleanAdminNote = adminNote?.trim() || null;

  if (status === "needs_changes" && !cleanReason) {
    throw new Error(locale === "ar" ? "سبب طلب التعديل مطلوب." : "A reason for requesting changes is required.");
  }
  if (status === "rejected" && !cleanReason) {
    throw new Error(locale === "ar" ? "سبب رفض الفرصة مطلوب." : "A rejection reason is required.");
  }

  const adminUser = await requireAdminAccess();
  const opportunity = await OpportunityService.getStatusSnapshot(id);

  if (!opportunity) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_opportunity_status",
      outcome: "failed",
      target: EVENT_TARGETS.OPPORTUNITY,
      targetId: id,
      reason: "opportunity_not_found",
      metadata: {
        requested_status: status,
        published,
      },
    });

    throw new Error("Opportunity not found.");
  }

  const adminClient = createAdminClient();
  let applicationStartDate: string | null = null;
  let applicationDeadline: string | null = null;
  let effectiveApplicationDays: number | null = null;

  if (status === "published" && published) {
    const { data: publisher, error: publisherError } = await adminClient
      .from("publishers")
      .select("id, profile_id, status")
      .eq("id", opportunity.publisher_id)
      .maybeSingle();

    if (publisherError || !publisher) {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "publish_opportunity",
        outcome: "failed",
        target: EVENT_TARGETS.OPPORTUNITY,
        targetId: id,
        reason: "publisher_not_found",
        metadata: {
          publisher_id:
            opportunity.publisher_id,
          previous_status:
            opportunity.status ?? null,
        },
      });

      throw new Error(locale === "ar" ? "تعذر العثور على حساب الناشر المرتبط بهذه الفرصة." : "The publisher account linked to this opportunity could not be found.");
    }

    if (publisher.status === "suspended") {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "publish_opportunity",
        outcome: "blocked",
        target: EVENT_TARGETS.OPPORTUNITY,
        targetId: id,
        reason: "publisher_suspended",
        metadata: {
          publisher_id: publisher.id,
          previous_status:
            opportunity.status ?? null,
        },
      });

      throw new Error(locale === "ar" ? "لا يمكن نشر الفرصة لأن حساب الناشر موقوف." : "This opportunity cannot be published because the publisher account is suspended.");
    }

    const { data: publisherProfile, error: publisherProfileError } = await adminClient
      .from("profiles")
      .select("approval_status")
      .eq("id", publisher.profile_id)
      .eq("account_type", "publisher")
      .maybeSingle();

    if (publisherProfileError || !publisherProfile) {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "publish_opportunity",
        outcome: "failed",
        target: EVENT_TARGETS.OPPORTUNITY,
        targetId: id,
        reason: "publisher_approval_lookup_failed",
        metadata: {
          publisher_id: publisher.id,
        },
      });

      throw new Error(locale === "ar" ? "تعذر التحقق من حالة اعتماد الناشر." : "Unable to verify the publisher approval status.");
    }

    if (publisherProfile.approval_status !== "approved") {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "publish_opportunity",
        outcome: "blocked",
        target: EVENT_TARGETS.OPPORTUNITY,
        targetId: id,
        reason: "publisher_not_approved",
        metadata: {
          publisher_id: publisher.id,
          publisher_approval_status:
            publisherProfile.approval_status,
        },
      });

      throw new Error(locale === "ar" ? "لا يمكن نشر الفرصة قبل اعتماد ملف الناشر." : "The opportunity cannot be published until the publisher profile is approved.");
    }

    const storedApplicationDays = Number(opportunity.application_days);
    effectiveApplicationDays = Number.isInteger(storedApplicationDays) && storedApplicationDays >= 1 && storedApplicationDays <= 90 ? storedApplicationDays : 30;
    const calculatedDates = calculateApplicationDates(effectiveApplicationDays);
    applicationStartDate = calculatedDates.applicationStartDate;
    applicationDeadline = calculatedDates.applicationDeadline;

    const { data, error } = await adminClient
      .from("opportunities")
      .update({ status, published, application_days: effectiveApplicationDays, application_start_date: applicationStartDate, application_deadline: applicationDeadline })
      .eq("id", id)
      .select("id,status,published,application_days,application_start_date,application_deadline")
      .maybeSingle();

    if (error) {
      console.error("[AdminOpportunity publish]", error);

      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "publish_opportunity",
        outcome: "failed",
        target: EVENT_TARGETS.OPPORTUNITY,
        targetId: id,
        reason: "opportunity_update_failed",
        metadata: {
          previous_status:
            opportunity.status ?? null,
          requested_status: status,
        },
      });

      throw new Error("Unable to publish the opportunity.");
    }

    if (!data) {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "publish_opportunity",
        outcome: "failed",
        target: EVENT_TARGETS.OPPORTUNITY,
        targetId: id,
        reason: "opportunity_missing_after_update",
      });

      throw new Error("Opportunity not found.");
    }
  } else {
    try {
      await OpportunityService.updateStatus({ id, status, published });
    } catch (error) {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "update_opportunity_status",
        outcome: "failed",
        target: EVENT_TARGETS.OPPORTUNITY,
        targetId: id,
        reason: "opportunity_status_update_failed",
        metadata: {
          previous_status:
            opportunity.status ?? null,
          requested_status: status,
          published,
        },
      });

      throw error;
    }
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action:
      status === "published"
        ? "publish_opportunity"
        : "update_opportunity_status",
    outcome: "success",
    target: EVENT_TARGETS.OPPORTUNITY,
    targetId: id,
    metadata: {
      previous_status:
        opportunity.status ?? null,
      new_status: status,
      published,
      publisher_id:
        opportunity.publisher_id ?? null,
      reason: cleanReason,
      admin_note: cleanAdminNote,
      application_days:
        effectiveApplicationDays,
      application_start_date:
        applicationStartDate,
      application_deadline:
        applicationDeadline,
    },
  });

  const eventType = getEventTypeForStatus(status);
  if (eventType && opportunity.publisher_id) {
    try {
      await createEvent({
        type: eventType,
        target: EVENT_TARGETS.PUBLISHER,
        targetId: opportunity.publisher_id,
        actorId: adminUser.id,
        metadata: {
          opportunityId: id,
          title: opportunity.title ?? null,
          locale,
          reason: cleanReason,
          adminNote: cleanAdminNote,
          previousStatus: opportunity.status ?? null,
          newStatus: status,
          published,
          applicationDays: effectiveApplicationDays,
          applicationStartDate,
          applicationDeadline,
          reviewedBy: adminUser.id,
          reviewedAt: new Date().toISOString(),
        },
      });
    } catch (eventError) {
      console.error("[AdminOpportunity event]", eventError);
    }
  }

  revalidateOpportunityPaths(id);
}

export async function publishOpportunityAction(formData: FormData) {
  const id = getOpportunityId(formData);
  const locale = getLocale(formData);
  await updateOpportunityStatus({ id, status: "published", published: true, locale, adminNote: getOptionalText(formData, "admin_note") });
}

export async function hideOpportunityAction(formData: FormData) {
  await updateOpportunityStatus({ id: getOpportunityId(formData), status: "draft", published: false, locale: getLocale(formData) });
}

export async function rejectOpportunityAction(formData: FormData) {
  await updateOpportunityStatus({ id: getOpportunityId(formData), status: "rejected", published: false, locale: getLocale(formData), reason: getOptionalText(formData, "reason"), adminNote: getOptionalText(formData, "admin_note") });
}

export async function requestChangesOpportunityAction(formData: FormData) {
  await updateOpportunityStatus({ id: getOpportunityId(formData), status: "needs_changes", published: false, locale: getLocale(formData), reason: getOptionalText(formData, "reason"), adminNote: getOptionalText(formData, "admin_note") });
}

export async function archiveOpportunityAction(formData: FormData) {
  await updateOpportunityStatus({ id: getOpportunityId(formData), status: "archived", published: false, locale: getLocale(formData) });
}

export async function setFeaturedOpportunityAction(formData: FormData) {
  const id = getOpportunityId(formData);
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();
  const featuredUntil = new Date();
  featuredUntil.setUTCDate(featuredUntil.getUTCDate() + 30);

  const { data, error } = await adminClient
    .from("opportunities")
    .update({ featured: true, featured_until: featuredUntil.toISOString() })
    .eq("id", id)
    .eq("published", true)
    .select("id")
    .maybeSingle();

  if (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "feature_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.OPPORTUNITY,
      targetId: id,
      reason: "feature_update_failed",
    });

    throw new Error(`Unable to feature opportunity: ${error.message}`);
  }

  if (!data) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "feature_opportunity",
      outcome: "blocked",
      target: EVENT_TARGETS.OPPORTUNITY,
      targetId: id,
      reason: "opportunity_not_published",
    });

    throw new Error("Only a published opportunity can be featured.");
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "feature_opportunity",
    outcome: "success",
    target: EVENT_TARGETS.OPPORTUNITY,
    targetId: id,
    metadata: {
      featured_until:
        featuredUntil.toISOString(),
    },
  });

  revalidateOpportunityPaths(id);
}

export async function clearFeaturedOpportunityAction(formData: FormData) {
  const id = getOpportunityId(formData);
  const adminUser = await requireAdminAccess();
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("opportunities")
    .update({ featured: false, featured_until: null })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "clear_featured_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.OPPORTUNITY,
      targetId: id,
      reason: "featured_clear_failed",
    });

    throw new Error(`Unable to remove featured opportunity: ${error.message}`);
  }

  if (!data) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "clear_featured_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.OPPORTUNITY,
      targetId: id,
      reason: "opportunity_not_found",
    });

    throw new Error("Opportunity not found.");
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "clear_featured_opportunity",
    outcome: "success",
    target: EVENT_TARGETS.OPPORTUNITY,
    targetId: id,
  });

  revalidateOpportunityPaths(id);
}
