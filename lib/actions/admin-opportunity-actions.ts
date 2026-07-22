"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";

type OpportunityStatus =
  | "published"
  | "rejected"
  | "draft"
  | "pending_review"
  | "needs_changes"
  | "closed"
  | "archived";

function revalidateOpportunityPaths(id: number) {
  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${id}`);

  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");

  revalidatePath("/ar/publisher-dashboard");
  revalidatePath("/en/publisher-dashboard");

  revalidatePath("/ar/publisher-dashboard/opportunities");
  revalidatePath("/en/publisher-dashboard/opportunities");

  revalidatePath(
    `/ar/publisher-dashboard/opportunities/${id}`,
  );
  revalidatePath(
    `/en/publisher-dashboard/opportunities/${id}`,
  );
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

async function updateOpportunityStatus({
  id,
  status,
  published,
}: {
  id: number;
  status: OpportunityStatus;
  published: boolean;
}) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid opportunity ID.");
  }

  const adminUser = await requireAdminAccess();

  const opportunity =
    await OpportunityService.getStatusSnapshot(id);

  if (!opportunity) {
    throw new Error("Opportunity not found.");
  }

  await OpportunityService.updateStatus({
    id,
    status,
    published,
  });

  const eventType = getEventTypeForStatus(status);

  if (eventType && opportunity.publisher_id) {
    try {
      await createEvent({
        type: eventType,
        target: EVENT_TARGETS.PUBLISHER,
        targetId: String(opportunity.publisher_id),
        actorId: adminUser.id,
        metadata: {
          opportunityId: id,
          title: opportunity.title ?? null,
          previousStatus: opportunity.status ?? null,
          newStatus: status,
          published,
        },
      });
    } catch (eventError) {
      console.error(
        "Failed to create admin opportunity event:",
        eventError,
      );
    }
  }

  revalidateOpportunityPaths(id);
}

function getOpportunityId(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid opportunity ID.");
  }

  return id;
}

export async function publishOpportunityAction(
  formData: FormData,
) {
  const id = getOpportunityId(formData);

  await updateOpportunityStatus({
    id,
    status: "published",
    published: true,
  });
}

export async function hideOpportunityAction(
  formData: FormData,
) {
  const id = getOpportunityId(formData);

  await updateOpportunityStatus({
    id,
    status: "draft",
    published: false,
  });
}

export async function rejectOpportunityAction(
  formData: FormData,
) {
  const id = getOpportunityId(formData);

  await updateOpportunityStatus({
    id,
    status: "rejected",
    published: false,
  });
}

export async function requestChangesOpportunityAction(
  formData: FormData,
) {
  const id = getOpportunityId(formData);

  await updateOpportunityStatus({
    id,
    status: "needs_changes",
    published: false,
  });
}

export async function archiveOpportunityAction(
  formData: FormData,
) {
  const id = getOpportunityId(formData);

  await updateOpportunityStatus({
    id,
    status: "archived",
    published: false,
  });
}