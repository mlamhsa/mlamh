"use server";

import { revalidatePath } from "next/cache";
import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";

function revalidateOpportunityPaths(id: number) {
  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
}

function getEventTypeForStatus(status: string) {
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
  status: string;
  published: boolean;
}) {
  const opportunity = await OpportunityService.getStatusSnapshot(id);

await OpportunityService.updateStatus({
  id,
  status,
  published,
});

const eventType = getEventTypeForStatus(status);

if (eventType && opportunity?.publisher_id) {
    await createEvent({
      type: eventType,
      target: EVENT_TARGETS.PUBLISHER,
      targetId: String(opportunity.publisher_id),
      actorId: "admin",
      metadata: {
        opportunityId: id,
        title: opportunity?.title ?? null,
        previousStatus: opportunity?.status ?? null,
        newStatus: status,
        published,
      },
    });
  }

  revalidateOpportunityPaths(id);
}

export async function publishOpportunityAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await updateOpportunityStatus({
    id,
    status: "published",
    published: true,
  });
}

export async function hideOpportunityAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await updateOpportunityStatus({
    id,
    status: "draft",
    published: false,
  });
}

export async function rejectOpportunityAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await updateOpportunityStatus({
    id,
    status: "rejected",
    published: false,
  });
}

export async function requestChangesOpportunityAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await updateOpportunityStatus({
    id,
    status: "needs_changes",
    published: false,
  });
}

export async function archiveOpportunityAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await updateOpportunityStatus({
    id,
    status: "archived",
    published: false,
  });
}