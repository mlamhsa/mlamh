"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OpportunityStatus =
  | "draft"
  | "pending_review"
  | "needs_changes"
  | "published"
  | "open"
  | "closed"
  | "archived";

type StatusAction = "close" | "archive" | "restore";

const ALLOWED_TRANSITIONS: Record<
  StatusAction,
  {
    from: OpportunityStatus[];
    to: OpportunityStatus;
  }
> = {
  close: {
    from: ["open", "published"],
    to: "closed",
  },
  archive: {
    from: [
      "draft",
      "pending_review",
      "needs_changes",
      "published",
      "open",
      "closed",
    ],
    to: "archived",
  },
  restore: {
    from: ["archived"],
    to: "closed",
  },
};

function normalizeOpportunityId(
  opportunityId: string | number,
): string | number {
  if (
    (typeof opportunityId === "string" &&
      opportunityId.trim().length === 0) ||
    (typeof opportunityId === "number" &&
      (!Number.isFinite(opportunityId) || opportunityId <= 0))
  ) {
    throw new Error("Invalid opportunity ID.");
  }

  return opportunityId;
}

async function updateOpportunityStatus(
  opportunityIdInput: string | number,
  action: StatusAction,
) {
  const opportunityId = normalizeOpportunityId(
    opportunityIdInput,
  );

  const transition = ALLOWED_TRANSITIONS[action];

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.account_type !== "publisher"
  ) {
    throw new Error("Publisher access required.");
  }

  const { data: publisher, error: publisherError } =
    await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

  if (publisherError || !publisher) {
    throw new Error("Publisher account not found.");
  }

  const { data: opportunity, error: opportunityError } =
    await adminClient
      .from("opportunities")
      .select("id, status")
      .eq("id", opportunityId)
      .eq("publisher_id", publisher.id)
      .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error(
      "Opportunity not found or access denied.",
    );
  }

  const currentStatus =
    opportunity.status as OpportunityStatus | null;

  if (
    !currentStatus ||
    !transition.from.includes(currentStatus)
  ) {
    throw new Error("This status change is not allowed.");
  }

  const { data: updatedOpportunity, error: updateError } =
    await adminClient
      .from("opportunities")
      .update({
        status: transition.to,
        published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunity.id)
      .eq("publisher_id", publisher.id)
      .eq("status", currentStatus)
      .select("id")
      .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!updatedOpportunity) {
    throw new Error(
      "Opportunity status changed before the update could complete.",
    );
  }

  const locales = ["ar", "en"] as const;

for (const locale of locales) {
  const dashboardPath =
    `/${locale}/publisher-dashboard`;

  const opportunitiesPath =
    `${dashboardPath}/opportunities`;

  const opportunityPath =
    `${opportunitiesPath}/${opportunity.id}`;

  revalidatePath(dashboardPath);
  revalidatePath(opportunitiesPath);
  revalidatePath(opportunityPath);
  revalidatePath(`${opportunityPath}/edit`);
  revalidatePath(`${opportunityPath}/applicants`);
}

revalidatePath("/ar/opportunities");
revalidatePath("/en/opportunities");
revalidatePath("/admin/opportunities");
}

export async function closeOpportunityAction(
  opportunityId: string | number,
): Promise<void> {
  await updateOpportunityStatus(
    opportunityId,
    "close",
  );
}

export async function archiveOpportunityAction(
  opportunityId: string | number,
): Promise<void> {
  await updateOpportunityStatus(
    opportunityId,
    "archive",
  );
}

export async function restoreOpportunityAction(
  opportunityId: string | number,
): Promise<void> {
  await updateOpportunityStatus(
    opportunityId,
    "restore",
  );
}